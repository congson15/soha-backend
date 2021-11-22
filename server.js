import express from 'express';
import SohaHelper from './core/index.js';
import * as fs from 'fs';
const port = 3000;
let soha = new SohaHelper();
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.all('*', function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key')
    if (req.method == 'OPTIONS') {
        res.status(200).end()
    } else {
        next();
    }
})
app.post('/api/filter-subject', async(req, res) => {
    let subject = req.body.subject;
    let cookie = req.body.cookie;
    let username = req.body.username;
    let password = req.body.password;
    if (!subject) {
        return
    }
    let listSubject = await soha.filterSubjects(subject, username, password, cookie);
    return res.send(JSON.stringify(listSubject));
})

app.post('/api/login', async(req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username && password) {
        let result = await soha.loginWithUserAndPassword(username, password);
        res.status("200").send(result);
        res.end();
    } else {
        res.status("404").send('Please enter Username and Password!');
        res.end();
    }
});
app.get('/my-log', (req, res) => {
    try {
        const data = fs.readFileSync('./log.txt', 'utf8')
        res.send(data);
    } catch (err) {
        res.send("File does not exists");
    }
});

app.listen(port, function() {
    console.log("Server is running on " + port + " port");
});