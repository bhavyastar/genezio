import log from "loglevel";
import { template } from "./genezioRuntimeGoMain.js";
import { GoBundler } from "./goBundlerBase.js";
import { BundlerInput } from "../bundler.interface.js";
import { $ } from "execa";

export class GenezioRuntimeGoBundler extends GoBundler {
    template = template;

    generateErrorReturn(): string {
        return `
            sendError(w, err, JsonRpcMethod)
            return
        `;
    }

    async compile(folderPath: string, _: BundlerInput) {
        // Compile the Go code locally
        const getDependencyResult = $({ cwd: folderPath })
            .sync`go get github.com/Genez-io/genezio_types`;
        if (getDependencyResult.exitCode == null) {
            log.info(
                "There was an error while running the go script, make sure you have the correct permissions.",
            );
            throw new Error("Compilation error! Please check your code and try again.");
        } else if (getDependencyResult.exitCode != 0) {
            log.info(getDependencyResult.stderr.toString());
            log.info(getDependencyResult.stdout.toString());
            throw new Error("Compilation error! Please check your code and try again.");
        }
        const result = $({ cwd: folderPath }).sync`go build -buildmode=plugin -o bootstrap main.go`;
        if (result.exitCode == null) {
            log.info(
                "There was an error while running the go script, make sure you have the correct permissions.",
            );
            throw new Error("Compilation error! Please check your code and try again.");
        } else if (result.exitCode != 0) {
            log.info(result.stderr.toString());
            log.info(result.stdout.toString());
            throw new Error("Compilation error! Please check your code and try again.");
        }
    }
}
