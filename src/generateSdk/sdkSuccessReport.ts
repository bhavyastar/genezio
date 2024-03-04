import log from "loglevel";
import { GenezioCommand, ProjectPrimaryKeys } from "../utils/reporter.js";
import { SdkGeneratorResponse } from "../models/sdkGeneratorResponse.js";
import colors from "colors";
import boxen from "boxen";
import packageManager from "../packageManagers/packageManager.js";
import { Language, TriggerType } from "../yamlProjectConfiguration/models.js";

export function reportSuccessForSdk(
    language: Language,
    sdkResponse: SdkGeneratorResponse,
    command: GenezioCommand,
    projectConfiguration: ProjectPrimaryKeys,
) {
    switch (language) {
        case Language.ts:
        case Language.js:
            return reportSuccessForSdkJs(sdkResponse, command, projectConfiguration);
        default:
            throw new Error("Language not supported");
    }
}


export function reportSuccessForSdkJs(
    sdkResponse: SdkGeneratorResponse,
    command: GenezioCommand,
    projectConfiguration: ProjectPrimaryKeys,
) {
    if (sdkResponse.files.length <= 0) {
        log.info("\x1b[36m%s\x1b[0m", "Your backend code was successfully deployed!");
        return
    }

    const className = sdkResponse.sdkGeneratorInput.
        classesInfo.find((c) => c.classConfiguration.type === TriggerType.jsonrpc)?.
        classConfiguration.name;
    if (command === GenezioCommand.deploy) {
       log.info(
           "\x1b[36m%s\x1b[0m",
           "Your backend code was deployed and the SDK was successfully generated",
       );
       log.info(
           boxen(
               `${colors.green(
                   "To install the SDK in your client, run this command in your client's root:",
               )}\n${colors.magenta(
                   `${packageManager.command} add @genezio-sdk/${projectConfiguration.name}_${projectConfiguration.region}@1.0.0-${projectConfiguration.stage}`,
               )}\n\n${colors.green(
                   "Then import your classes like this:",
               )}\n${colors.magenta(
                   `import { ${className} } from "@genezio-sdk/${projectConfiguration.name}_${projectConfiguration.region}"`,
               )}`,
               {
                   padding: 1,
                   margin: 1,
                   borderStyle: "round",
                   borderColor: "magentaBright",
               },
           ),
       );
    } else {
       log.info(
           "\x1b[36m%s\x1b[0m",
           "Your local server is running and the SDK was successfully generated!",
       );
           log.info(
           boxen(
               `${colors.green("Import your classes like this:")}\n${colors.magenta(
                   `import { ${className} } from "@genezio-sdk/${projectConfiguration.name}_${projectConfiguration.region}"`,
               )}`,
               {
                   padding: 1,
                   margin: 1,
                   borderStyle: "round",
                   borderColor: "magentaBright",
               },
           ),
       );
    }
}
