export namespace main {
	
	export class Server {
	    name: string;
	    user: string;
	    password: string;
	    port: string;
	
	    static createFrom(source: any = {}) {
	        return new Server(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.user = source["user"];
	        this.password = source["password"];
	        this.port = source["port"];
	    }
	}

}
