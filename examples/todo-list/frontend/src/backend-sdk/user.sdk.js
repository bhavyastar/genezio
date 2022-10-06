import { Env, Remote } from "./remote.js"

export class User {
    static remote = new Remote("https://a4wvcqeztsbxgngodjkbwwiizm0xqgbq.lambda-url.us-east-1.on.aws/")

    static async connect() {
        return User.remote.call("User.connect")  
    }
    
    static async create(name, email, password) {
        return User.remote.call("User.create", name, email, password)  
    }

    static async login(email, password) {
        return User.remote.call("User.login", email, password)  
    }

    static async register(name, email, password) {
        return User.remote.call("User.register", name, email, password)  
    }

    static async checkSession(token) {
        return User.remote.call("User.checkSession", token)  
    }

    
}

export { Env, Remote };