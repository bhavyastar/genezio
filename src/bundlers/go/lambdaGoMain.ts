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
    "errors"
    "context"
    "path"
    "github.com/Genez-io/genezio_types"
    "github.com/aws/aws-lambda-go/lambda"

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

func sendError(err error, methodType MethodType) *Response {
    genezioError := make(map[string]interface{})
    byteError, error := json.Marshal(err)
    if error != nil {
        return nil
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
        return nil
    }
	response := &Response{
		StatusCode: "200",
		Body:       string(responseErrorByte),
		Headers: map[string]string{
			"Content-Type": "application/json",
			"X-Powered-By": "genezio",
		},
	}
    return response
}

func handleRequest(context context.Context, event *Event) (*Response, error) {
	var body EventBody
	var responseBody ResponseBody

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
                errorResponse := sendError(err, CronMethod)
                return errorResponse, nil
            }
        {{/cronMethods}}
        default:
            errorResponse := sendError(errors.New("Cron method not found"), CronMethod)
            return errorResponse, nil
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
                errorResponse := sendError(err, HttpMethod)
                return errorResponse, nil
            }
            genezioRequest.Body = bodyDecoded
        } else {
            var jsonBody interface{}
            err := json.Unmarshal(eventBody, &jsonBody)
            if err != nil {
                genezioRequest.Body = event.Body
            } else {
                genezioRequest.Body = jsonBody
            }
        }
        methodName := path.Base(event.RequestContext.Http.Path)
        var result *genezio_types.GenezioHttpResponse
        var err error

        switch methodName {
        {{#httpMethods}}
        case "{{name}}":
            result, err = class.{{name}}(genezioRequest)
            if err != nil {
                errorResponse := sendError(err, HttpMethod)
                return errorResponse, nil
            }
        {{/httpMethods}}
        default:
            errorResponse := sendError(errors.New("Http method not found"), HttpMethod)
            return errorResponse, nil
        }
        byteBody, ok := result.Body.([]byte)
        if !ok {
            responseBody, err := json.Marshal(result.Body)
            if err != nil {
                errorResponse := sendError(err, HttpMethod)
                return errorResponse, nil
            }
            result.Body = string(responseBody)
        } else {
            result.Body = base64.StdEncoding.EncodeToString(byteBody)
            var isBase64Encoded bool = true
            result.IsBase64Encoded = &isBase64Encoded
        }
        var responseHeaders map[string]string
        if result.Headers != nil {
            responseHeaders = *result.Headers
        }
        response := &Response{
            StatusCode: result.StatusCode,
            Body:       result.Body.(string),
            Headers:    responseHeaders,
        }
        return response, nil
    } else {
        eventBody := []byte(event.Body)
        // Decode the request body into struct and check for errors
        err := json.Unmarshal(eventBody, &body)
        if err != nil {
            errorResponse := sendError(err, JsonRpcMethod)
            return errorResponse, nil
        }
        // Call the appropriate method
        switch body.Method {
        {{#jsonRpcMethods}}
        case "{{class.name}}.{{name}}":
            {{#parameters}}
            {{{cast}}}
            {{/parameters}}
            {{^isVoid}}result, {{/isVoid}}err {{^isVoid}}:{{/isVoid}}= class.{{name}}({{#parameters}}param{{index}}{{^last}}, {{/last}}{{/parameters}})
            if err != nil {
                errorResponse := sendError(err, JsonRpcMethod)
                return errorResponse, nil
            }
            {{^isVoid}}
            responseBody.Result = result
            {{/isVoid}}
        {{/jsonRpcMethods}}
        {{#cronMethods}}
        case "{{class.name}}.{{name}}":
            err := class.{{name}}()
            if err != nil {
                errorResponse := sendError(err, JsonRpcMethod)
                return errorResponse, nil
            }
        {{/cronMethods}}
        default:
            errorResponse := sendError(errors.New("Method not found"), JsonRpcMethod)
            return errorResponse, nil
        }
    }

	responseBody.Id = body.Id
	responseBody.Jsonrpc = body.Jsonrpc

    bodyString, err := json.Marshal(responseBody)
    if err != nil {
        errorResponse := sendError(err, JsonRpcMethod)
        return errorResponse, nil
    }

	response := &Response{
        StatusCode: "200",
		Body:       string(bodyString),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

    return response, nil
}

func main() {
    lambda.Start(handleRequest)
}
`;
