import { HelloWorld, Season } from "./sdk/hello.sdk"

/**
 * Client that makes requests to the HelloWorldService deployed on genez.io.
 * 
 * Before running this script, run either "genezio deploy" or "genezio local".
 */

(async () => {
    // Use the SDK to make requests to the Hello World Service.
    console.log(await HelloWorld.hello("George", "Tenerife", Season.Winter))
})()