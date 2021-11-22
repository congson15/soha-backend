import request from './rpClient.js';
import cheerio from 'cheerio';
import * as fs from 'fs';


class SohaHelper {
    constructor() {
        this.cookie;
        this.viewState;
        this.fullName;
    }

    async getCookieAndViewState() {
        let result = await request.get('/');
        let re = /ASP\.NET_SessionId=(.*?);/g;
        let cookie = JSON.stringify(result.headers['set-cookie']);
        cookie = re.exec(JSON.stringify(cookie))[1];
        let $ = cheerio.load(result.body);
        let viewState = $('#__VIEWSTATE').val();
        this.cookie = cookie;
        this.viewState = viewState;
    }


    async loginWithUserAndPassword(user, password) {
        await this.getCookieAndViewState();
        let formData = {
            '__VIEWSTATE': this.viewState,
            'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$txtTaiKhoa': user,
            'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$txtMatKhau': password,
            'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$btnDangNhap': 'Đăng Nhập'
        }
        let headers = {
            'Cookie': `ASP.NET_SessionId=${this.cookie}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36'
        }
        try {
            let result = await request.post('/default.aspx', formData, headers);
            const $ = cheerio.load(result);
            let json = {};
            this.fullName = $('#ctl00_Header1_Logout1_lblNguoiDung').text();
            let isLogin = $('#ctl00_menu_lblThayDoiTTCN').text();
            if (isLogin.length > 0) {
                json.cookie = this.cookie;
                json.fullName = this.fullName;
                json.message = "Đăng nhập thành công"
                fs.appendFile('log.txt', `${json.fullName}\n<br>`, function(err) {
                    if (err) throw err;
                });
                return JSON.stringify(json);
            }
        } catch (error) {
            console.log(error);
        }
    }

    async checkLiveCookie(cookie) {
        let headers = {
            'Cookie': `ASP.NET_SessionId=${cookie}`,
        }
        let result = await request.get('/Default.aspx?page=thaydoittcn', headers)
        let $ = cheerio.load(result.body);
        let live = $('#ctl00_ContentPlaceHolder1_ctl00_lblTieuDe').text();
        if (live.includes('THAY ĐỔI THÔNG TIN CÁ NHÂN')) {
            return true;
        }
        return false;
    }

    async getViewState(cookie) {
        let headers = {
            'Cookie': `ASP.NET_SessionId=${cookie}`,
        }
        let result = await request.get('/', headers);
        let $ = cheerio.load(result.body);
        let viewState = $('#__VIEWSTATE').val();
        return viewState;
    }


    async refreshAccount(user, password, cookie) {
        let viewState = await this.getViewState(cookie);
        let formData = {
            '__VIEWSTATE': viewState,
            'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$txtTaiKhoa': user,
            'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$txtMatKhau': password,
            'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$btnDangNhap': 'Đăng Nhập'
        }
        let headers = {
            'Cookie': `ASP.NET_SessionId=${cookie}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36'
        }
        await request.post('/default.aspx', formData, headers);
    }

    async filterSubjects(subjectName, user, password, cookie) {
        let headers = {
            'Cookie': `ASP.NET_SessionId=${cookie}`,
            'X-AjaxPro-Method': 'LocTheoMonHoc'
        }
        let isAlive = await this.checkLiveCookie(cookie);
        if (!isAlive) {
            await this.refreshAccount(user, password, cookie);
        }
        let data = `{"dkLoc":"${subjectName}"}`;
        let result = await request.post('/ajaxpro/EduSoft.Web.UC.DangKyMonHoc,EduSoft.Web.ashx', data, headers);
        return this.createSubjects(result);


    }

    createSubjects(subjects) {
        if (subjects.toString().indexOf("Object reference not set to an instance of an object.") !== -1) {
            return {
                message: 'Không lọc được môn, vui lòng thử lại sau.'
            }
        }
        let allSubject = subjects.split(`"value":"`);
        let tableElm = allSubject[1].replace(/\&nbsp;/g, '').replace(/\\r/g, '').replace(/\\n/g, '').replace(/\\/g, '').replace(/<div class=\"fline\">\s+<\/div>/g, '');
        let subject = {}
        let result = [];
        let re = /top-fline">(.*?)</g
        let $ = cheerio.load(tableElm);
        let match;
        $('table').each((index, element) => {
            subject.id = $(element).find('td:nth-child(1) input').val();
            subject.maMon = $(element).find('td:nth-child(2)').text();
            subject.tenMon = $(element).find('td:nth-child(3)').text();
            subject.maNhom = $(element).find('td:nth-child(4)').text();
            subject.maTTH = $(element).find('td:nth-child(5)').text();
            subject.soTC = $(element).find('td:nth-child(6)').text();
            subject.siSo = $(element).find('td:nth-child(9)').text();
            subject.conLai = $(element).find('td:nth-child(10)').text();
            subject.thu = [];
            subject.tietBatDau = [];
            subject.soTiet = [];
            subject.phongHoc = [];
            subject.giangVien = [];
            while (match = re.exec($(element).find('td:nth-child(12)').toString())) {
                subject.thu.push(match[1])
            }
            while (match = re.exec($(element).find('td:nth-child(13)').toString())) {
                subject.tietBatDau.push(match[1])
            }
            while (match = re.exec($(element).find('td:nth-child(14)').toString())) {
                subject.soTiet.push(match[1])
            }
            while (match = re.exec($(element).find('td:nth-child(15)').toString())) {
                subject.phongHoc.push(match[1])
            }
            while (match = re.exec($(element).find('td:nth-child(16)').toString())) {
                subject.giangVien.push(match[1])
            }
            result.push(subject);
            subject = {};
        })
        return result;
    }
}

export default SohaHelper