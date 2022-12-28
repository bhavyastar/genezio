import axios from "axios";
import fs from "fs";
import { getAuthToken } from "../utils/accounts";
import { BACKEND_ENDPOINT } from "../variables";

export async function getPresignedURL (
    region = "us-east-1",
    archiveName = "genezioDeploy.zip",
    projectName: string,
    className: string,
) {
    if (!region || !archiveName || !projectName || !className) {
        throw new Error("Missing required parameters");
    }

    // Check if user is authenticated
    const authToken = await getAuthToken()
    if (!authToken) {
        throw new Error(
            "You are not logged in. Run 'genezio login' before you deploy your function."
        );
    }
    
    const response: any = await axios({
        method: "GET",
        url: `${BACKEND_ENDPOINT}/core/deployment-url?projectName=${projectName}&className=${className}&fileName=${archiveName}&region=${region}`, 
        headers: {Authorization: `Bearer ${authToken}`},
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }).catch((error: Error) => {
        throw error;
      });
    
    if (response.data.status === "error") {
        throw new Error(response.data.message);
    }

    if (response.data?.error?.message) {
        throw new Error(response.data.error.message);
    }

    return response.data;
}
