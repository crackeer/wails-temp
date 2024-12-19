export namespace main {
	
	export class Command {
	    id: string;
	    name: string;
	    data: string;
	
	    static createFrom(source: any = {}) {
	        return new Command(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.data = source["data"];
	    }
	}
	export class Server {
	    id: string;
	    name: string;
	    ip: string;
	    user: string;
	    password: string;
	    port: string;
	
	    static createFrom(source: any = {}) {
	        return new Server(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.ip = source["ip"];
	        this.user = source["user"];
	        this.password = source["password"];
	        this.port = source["port"];
	    }
	}

}

