var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}


let sessions={

}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var path = request.url
    var query = ''
    if (path.indexOf('?') >= 0) {
        query = path.substring(path.indexOf('?'))
    }
    var pathNoQuery = parsedUrl.pathname
    var queryObject = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/













    console.log('方方说：得到 HTTP 路径为\n' + path)
    console.log('方方说：查询字符串为\n' + query)
    console.log('方方说：不含查询字符串的路径为\n' + pathNoQuery)
    if (path === '/') {
        let string = fs.readFileSync('./index.html', 'utf8')
        console.log(string)
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        console.log('request.headers.cookie')
        console.log(request.headers.cookie)
        let cookies=request.headers.cookie.split('; ') //['email=1@','a=1','b=2']
        let hash={}
        for(let i=0;i<cookies.length;i++){
            let parts=cookies[i].split('=')
            let key=parts[0]
            let value=parts[1]
            hash[key]=value
        }
        console.log('hash')
        console.log(hash)
        let email=hash.sign_in_email
        let users=fs.readFileSync('./db/users','utf8')
        users=JSON.parse(users)
        let foundUser
        for(let i=0;i<users.length;i++){
            if(users[i].email===email){
                 foundUser=users[i]
                console.log(foundUser)
                break
            }
        }
        console.log(typeof foundUser)
        console.log(foundUser==true)
        if(foundUser){
            console.log('登录成功')
           string= string.replace('__password__',foundUser.password)
        }else{
            console.log('登录失败')
           string= string.replace('__password__','不知道')
        }


        response.write(string)
        response.end()
    } else if (path === '/sign_up' && method === 'GET') {
        let string = fs.readFileSync('./sign_up.html', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()

    }
    else if (path === '/sign_up' && method === 'POST') {
        //拿到用户上传的第四部分
        readBody(request).then((body) => {
            // console.log(body)
            let string=body.split('&') //['email=1','password=2','password_confirmation=3']
            console.log('string')
            console.log(string)
            let hash={}
            string.forEach((string)=>{
                //string == 'email=1
                let parts= string.split('=')  //['email','1']
                let key=parts[0]
                let value=parts[1]
                hash[key]=decodeURIComponent(value) //hash['email']='1'

            })
            // let email=hash['email']
            // let password=hash['password']
            // let password_confirmation=hash['password_confirmation']
            // 等价于
            let {email,password,password_confirmation}=hash
            console.log(email)
            if(email.indexOf('@')===-1){
                response.statusCode=400
                response.setHeader('Content-Type', 'application/json;charset=utf-8')
                console.log('email is bad')
                response.write(`
                {
                "error":{
                    "email":"invalid"
                }
                }
                `)
            }else if(password!=password_confirmation){
                response.statusCode=400
                console.log('passowrd is not match')
            }else{
                var users=fs.readFileSync('./db/users','utf8')
                try{
                    users=JSON.parse(users)  //[]
                }catch (exception) {
                    users=[]
                }
                let inUse=false;
                for(let i=0;i<users.length;i++){
                    console.log(email)
                    let user=users[i]
                    console.log('-------')
                    console.log(user.email)
                    if(user.email===email){
                        inUse=true
                        break;
                    }
                }
                console.log('inUSe')
                console.log(inUse)
                if(inUse){
                    response.statusCode=400
                    response.setHeader('Content-Type', 'application/json;charset=utf-8')
                    response.write(`
                {
                "error":{
                    "email":"existing"
                }
                }
                `)
                }else {
                    users.push({email: email, password: password})
                    var usersString = JSON.stringify(users)
                    fs.writeFileSync('./db/users', usersString)  //写进文件
                    response.statusCode = 200
                }

            }


            response.end()
        })


    }else if (path === '/sign_in' && method === 'GET') {
        let string = fs.readFileSync('./sign_in.html', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()

    }
    else if (path === '/sign_in' && method === 'POST') {
        //拿到用户上传的第四部分
        readBody(request).then((body) => {
            // console.log(body)
            let string=body.split('&') //['email=1','password=2']
            let hash={}
            string.forEach((string)=>{
                //string == 'email=1
                let parts= string.split('=')  //['email','1']
                let key=parts[0]
                let value=parts[1]
                hash[key]=decodeURIComponent(value) //hash['email']='1'

            })
            // let email=hash['email']
            // let password=hash['password']
            // let password_confirmation=hash['password_confirmation']
            // 等价于
            let {email,password}=hash
            console.log('email')
            console.log(email)
            console.log('password')
            console.log(password)

            //  验证密码和用户
            var users=fs.readFileSync('./db/users','utf8')
            try{
                users=JSON.parse(users)  //[]
            }catch (exception) {
                users=[]
            }
            let found
            for(let i=0;i<users.length;i++) {
                if (users[i].email === email && users[i].password === password) {

                    found = true
                    break;

                }
            }
            if(found){

                response.setHeader('Content-Type', 'text/html;charset=utf-8')
                response.setHeader('Set-Cookie',`sign_in_email=${email}`)
                response.setHeader('Set-Cookie',`sign_in_password=${password}`)
                response.setHeader('Set-Cookie',`a=123`)
                response.statusCode=200
                console.log(1)

            }else{
                response.statusCode=401
            }





            response.end()
        })


    }
    else if (path === '/main.js') {
        let string = fs.readFileSync('./main.js', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/xxx') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    }
    else {
        response.statusCode = 404
        response.end()
    }


    /******** 代码结束，下面不要看 ************/

})
    function readBody(request) {
        return new Promise((resolve, reject) => {
            let body=[]
            request.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {

                body = Buffer.concat(body).toString();
                // at this point, `body` has the entire request body stored in it as a string

                resolve(body)
            });
        })
    }

    server.listen(port)
    console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)

