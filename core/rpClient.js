import rp from 'request-promise';

const SGU_URL = 'http://thongtindaotao.sgu.edu.vn';


const request = {
    post: (path,formData,headers={}) => {
        let options = {
            followAllRedirects: true,
            headers: headers,
            method: 'POST',
            url: SGU_URL + path,
            form: formData,
        } 

        return rp(options).then((res) => {
            return res;
        })
    },
    get: (path,headers={}) => {
        let options = {
            headers: headers,
            method: 'GET',
            url: SGU_URL + path,
            resolveWithFullResponse: true,
            
        }        
        return rp(options).then((res) => {
            return res
        })
    }
}

export default request