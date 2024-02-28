export const template = `
/**
* GO
* This is an autogenerated code. This code should not be modified since the file can be overwritten
* if new genezio commands are executed.
 */
package main

import (
	"encoding/json"
    "encoding/base64"
	"net/http"
	"os"
    "io"
    "errors"
    "path"
    "github.com/Genez-io/genezio_types"

    {{#imports}}
    {{#named}}{{name}} {{/named}}"{{{path}}}"
    {{/imports}}
)

type RequestContext struct {
    TimeEpoch int64 \`json:"timeEpoch"\`
    Http struct {
		Method    string \`json:"method"\`
		Path      string \`json:"path"\`
		Protocol  string \`json:"protocol"\`
		UserAgent string \`json:"userAgent"\`
		SourceIp  string \`json:"sourceIp"\`
    } \`json:"http"\`
}

type Event struct {
	Body string \`json:"body"\`
    Headers map[string]string \`json:"headers"\`
    GenezioEventType string \`json:"genezioEventType,omitempty"\`
    MethodName string \`json:"methodName,omitempty"\`
    RequestContext RequestContext \`json:"requestContext,omitempty"\`
    QueryStringParameters map[string]string \`json:"queryStringParameters,omitempty"\`
    IsBase64Encoded bool \`json:"isBase64Encoded,omitempty"\`
}

type EventBody struct {
	Id      int           \`json:"id"\`
	Method  string        \`json:"method"\`
	Params  []interface{} \`json:"params"\`
	Jsonrpc string        \`json:"jsonrpc"\`
}

type ResponseBody struct {
	Id      int         \`json:"id"\`
	Result  interface{} \`json:"result"\`
	Jsonrpc string      \`json:"jsonrpc"\`
}

type Response struct {
	StatusCode string            \`json:"statusCode"\`
	Body       string            \`json:"body"\`
	Headers    map[string]string \`json:"headers"\`
}

type ErrorStruct struct {
	Code    int                     \`json:"code"\`
	Message string                  \`json:"message"\`
    Info    *map[string]interface{} \`json:"info,omitempty"\`
}

type ResponseBodyError struct {
	Id      int         \`json:"id"\`
	Error   ErrorStruct \`json:"error"\`
	Jsonrpc string      \`json:"jsonrpc,omitempty"\`
}

type MethodType string

const (
    CronMethod MethodType = "cron"
    HttpMethod MethodType = "http"
    JsonRpcMethod MethodType = "jsonrpc"
)

func sendError(w http.ResponseWriter, err error, methodType MethodType) {
    genezioError := make(map[string]interface{})
    byteError, error := json.Marshal(err)
    if error != nil {
        http.Error(w, error.Error(), http.StatusInternalServerError)
        return
    }
    json.Unmarshal(byteError, &genezioError)
	var responseError ResponseBodyError
	responseError.Id = 0
    if genezioError["Code"] != nil {
	    responseError.Error.Code = int(genezioError["Code"].(float64))
    }
    if genezioError["Info"] != nil {
        info := genezioError["Info"].(map[string]interface{})
        responseError.Error.Info = &info
    }
	responseError.Error.Message = err.Error()
    if methodType == JsonRpcMethod {
	    responseError.Jsonrpc = "2.0"
    }
    responseErrorByte, err := json.Marshal(responseError)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
	response := Response{
		StatusCode: "200",
		Body:       string(responseErrorByte),
		Headers: map[string]string{
			"Content-Type": "application/json",
			"X-Powered-By": "genezio",
		},
	}
	responseByte, err := json.Marshal(response)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, string(responseByte))
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	var event Event
	var body EventBody
	var responseBody ResponseBody

	err := json.NewDecoder(r.Body).Decode(&event)
	if err != nil {
        sendError(w, err, JsonRpcMethod)
		return
	}

    defer r.Body.Close()

    class := {{class.packageName}}.New()

    var isJsonRpcRequest bool

    eventBody := []byte(event.Body)
    // Decode the request body into struct and check for errors
    bodyUnmarshallError := json.Unmarshal(eventBody, &body)
    if bodyUnmarshallError == nil && body.Jsonrpc == "2.0" {
        isJsonRpcRequest = true
    }

    if event.GenezioEventType == "cron" {
        methodName := event.MethodName
        switch methodName {
        {{#cronMethods}}
        case "{{name}}":
            err := class.{{name}}()
            if err != nil {
                sendError(w, err, CronMethod)
                return
            }
        {{/cronMethods}}
        default:
            sendError(w, errors.New("cron method not found"), CronMethod)
            return
        }
    } else if !isJsonRpcRequest {
        genezioRequest := genezio_types.GenezioHttpRequest{
            Headers: event.Headers,
            QueryStringParameters: &event.QueryStringParameters,
            TimeEpoch: event.RequestContext.TimeEpoch,
            Http: event.RequestContext.Http,
            RawBody: string(eventBody),
        }
        if event.IsBase64Encoded {
            bodyDecoded, err := base64.StdEncoding.DecodeString(event.Body)
            if err != nil {
                sendError(w, err, HttpMethod)
                return
            }
            genezioRequest.Body = string(bodyDecoded)
        } else {
            var jsonBody interface{}
            err = json.Unmarshal(eventBody, &jsonBody)
            if err != nil {
                genezioRequest.Body = event.Body
            } else {
                genezioRequest.Body = jsonBody
            }
        }
        methodName := path.Base(event.RequestContext.Http.Path)
        var result *genezio_types.GenezioHttpResponse

        switch methodName {
        {{#httpMethods}}
        case "{{name}}":
            result, err = class.{{name}}(genezioRequest)
            if err != nil {
                sendError(w, err, HttpMethod)
                return
            }
        {{/httpMethods}}
        default:
            sendError(w, errors.New("http method not found"), HttpMethod)
            return
        }

        resultBody, err := json.Marshal(result.Body)
        if err != nil {
            sendError(w, err, HttpMethod)
            return
        }
        result.Body = string(resultBody)
        response, err := json.Marshal(result)
        if err != nil {
            sendError(w, err, HttpMethod)
            return
        }  
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        io.WriteString(w, string(response))
        return
    } else {
        // Call the appropriate method
        switch body.Method {
        {{#jsonRpcMethods}}
        case "{{class.name}}.{{name}}":
            {{#parameters}}
            {{{cast}}}
            {{/parameters}}
            {{^isVoid}}result, {{/isVoid}}err {{^isVoid}}:{{/isVoid}}= class.{{name}}({{#parameters}}param{{index}}{{^last}}, {{/last}}{{/parameters}})
            if err != nil {
                sendError(w, err, JsonRpcMethod)
                return
            }
            {{^isVoid}}
            responseBody.Result = result
            {{/isVoid}}
        {{/jsonRpcMethods}}
        {{#cronMethods}}
        case "{{class.name}}.{{name}}":
            err := class.{{name}}()
            if err != nil {
                sendError(w, err, JsonRpcMethod)
                return
            }
        {{/cronMethods}}
        default:
            sendError(w, errors.New("method not found"), JsonRpcMethod)
            return
        }
        responseBody.Id = body.Id
        responseBody.Jsonrpc = body.Jsonrpc
    }

    bodyString, err := json.Marshal(responseBody)
    if err != nil {
        sendError(w, err, JsonRpcMethod)
        return
    }

	response := Response{
        StatusCode: "200",
		Body:       string(bodyString),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

    // Encode the struct into JSON and check for errors
	responseByte, err := json.Marshal(response)
	if err != nil {
        sendError(w, err, JsonRpcMethod)
		return
	}
	w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
	io.WriteString(w, string(responseByte))
}

func main() {
	port := os.Args[1]
	http.HandleFunc("/", handleRequest)
	http.ListenAndServe(":"+port, nil)
}
`;
