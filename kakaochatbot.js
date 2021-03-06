const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const port = 30000
const dbconfig = require('./database.js')
const connection = mysql.createConnection(dbconfig)
const app = express()
const exec = require("child_process").exec

app.use(bodyParser.json())

const todayClock = (v) => {
        const s = "00" + v
        return s.substr(s.length - 2, 2)
}
let endlog //로그 찍기위한 변수
let d //현재 날짜 Date() 저장
let todaylog //로그에 사용 YYYY-MM-DD-HH:mm:ss 
let today //Date()를 이용 YYYY년MM월DD일
let datelog //Date()를 이용 YYYY-MM-DD
let oakuser //오크우드 관리자 신청
let tradeuser //무역센터 관리자 신청
let oakadmin //오크우드 관리자 
let tradeadmin //무역센터 관리자
let botmsg //클라이언트에 res
let user_key //클라이언트 key
let type //클라이언트 msg type
let content //req 값
let sqlquery //query 문

/**
 * 카카오서버는 /keyboard 주기적으로 봇서버의 상태를 확인함
 */
app.get('/keyboard', function (req, res) {
        let keyboard = {
                'type': 'text'
        }
        res.send(keyboard)
})
/**
 * 카카오서버가 클라이언트의 정보를 담아서 보내준다.
 * 이때 body에 있는 user_key, type, content를 사용한다
 */
app.post('/message', function (req, res) {
        d = new Date()
        let [month, day, hour, min, sec] = [(d.getMonth() + 1), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()]
        todaylog = d.getFullYear() + "-" + todayClock(month) + "-" + todayClock(day) + "-" + todayClock(hour) + ":" + todayClock(min) + ":" + todayClock(sec)
        today = d.getFullYear() + "년" + todayClock(month) + "월" + todayClock(day) + "일"
        datelog = d.getFullYear() + "-" + todayClock(month) + "-" + todayClock(day)
        endlog = " >> ./log/" + datelog + ".log"
        user_key = decodeURIComponent(req.body.user_key) // user's key
        type = decodeURIComponent(req.body.type) // message type
        content = decodeURIComponent(req.body.content) // user's message
        botsay = ""
        oakuser = "oakuser"
        tradeuser = "tradeuser"
        oakadmin = "oakadmin"
        tradeadmin = "tradeadmin"
        sqlquery = ""
        if (content == "오늘전시" || content == "ㅇㄴㅈㅅ" || content == "ㅇㄵㅅ") {
                sqlquery = "select EVENT_NUMBER, EVENT_NAME, EVENT_END, EVENT_FEE from COEX_EVENT where EVENT_START <= CURRENT_DATE( ) and EVENT_END > CURRENT_DATE( )"
                connection.query(sqlquery, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                var fee = row.EVENT_FEE
                                if (botsay != "") {
                                        botsay += '\n'
                                }
                                if (fee.indexOf('원') != -1) {
                                        var won = row.EVENT_FEE.split('원')
                                        if (won[1] != null) {
                                                won[1] = '\n' + won[1]
                                        }
                                        fee = won[0] + '원' + won[1]
                                }
                                botsay += "전시번호: " + row.EVENT_NUMBER + "\n" +
                                        '전시명: ' + row.EVENT_NAME + '\n' +
                                        '종료일:' + row.EVENT_END.toLocaleDateString("ko-kr") + '\n' +
                                        '입장료: ' + fee + '\n'
                        })
                        if (botsay == "") {
                                botsay = "오늘 전시가 없습니다."
                        } else {
                                botsay += "\n자세히 보기: 전시자세히 전시번호\n" + today
                        }

                        respkakao(botsay, res)
                })
                connection.end()
        } else if (content == "일주전시" || content == "ㅇㅈㅈㅅ") {
                sqlquery = "select EVENT_NUMBER, EVENT_NAME, EVENT_START, EVENT_END from COEX_EVENT where EVENT_START > date_add(now(), interval +0 day) and EVENT_START <= date_add(now(), interval +7 day)"
                connection.query(sqlquery, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]

                                if (botsay != '') {
                                        botsay += '\n'
                                }
                                botsay += "전시번호: " + row.EVENT_NUMBER + "\n" +
                                        "전시명: " + row.EVENT_NAME + "\n" +
                                        "시작일:" + row.EVENT_START.toLocaleDateString("ko-kr") + "\n" +
                                        "종료일:" + row.EVENT_END.toLocaleDateString("ko-kr") + "\n"
                        })

                        if (botsay == "") {
                                botsay = "전시가 없습니다."
                        } else {
                                botsay += "\n자세히 보기: 전시자세히 행사번호"
                        }
                        respkakao(botsay, res)
                })
                connection.end()
        } else if (content == "전시" || content == "ㅈㅅ") {
                botsay = "진행중 : 오늘전시 또는 ㅇㄴㅈㅅ\n " +
                        "Day+7 행사 : 일주전시 또는 ㅇㅈㅈㅅ "
                respkakao(botsay, res)
        } else if (content.indexOf("전시자세히") != -1) {
                var detail = content.split("전시자세히")
                if (detail[1] && detail[1] > 0) {
                        var detailNum = detail[1]
                        sqlquery = "select EVENT_NUMBER, EVENT_NAME, EVENT_START, EVENT_END, EVENT_PLACE, EVENT_FEE, EVENT_HOST, EMAIL, HOMEPAGE from COEX_EVENT where EVENT_NUMBER = " + detailNum
                        connection.query(sqlquery, function (err, rows) {
                                if (err) throw errorthrow()
                                Object.keys(rows).forEach(function (key) {
                                        var row = rows[key]
                                        var fee = row.EVENT_FEE
                                        if (botsay != '') {
                                                botsay += '\n'
                                        }
                                        if (fee.indexOf('원') != -1) {
                                                var won = row.EVENT_FEE.split('원')
                                                if (won[1] != null) {
                                                        won[1] = '\n' + won[1]
                                                }
                                                fee = won[0] + '원' + won[1]
                                        }
                                        botsay += "전시번호: " + row.EVENT_NUMBER + "\n" +
                                                "전시명: " + row.EVENT_NAME + "\n" +
                                                "시작일:" + row.EVENT_START.toLocaleDateString("ko-kr") + "\n" +
                                                "종료일:" + row.EVENT_END.toLocaleDateString("ko-kr") + "\n" +
                                                "장소: " + row.EVENT_PLACE + "\n" +
                                                "요금: " + fee + "\n" +
                                                "주최: " + row.EVENT_HOST + "\n" +
                                                "EMAIL: " + row.EMAIL + "\n" +
                                                "홈페이지: " + row.HOMEPAGE + "\n"
                                })
                                if (botsay == "") {
                                        botsay = "전시가 없습니다."
                                }
                                respkakao(botsay, res)
                        })
                        connection.end()
                } else {
                        respkakao(botsay, res)
                }
        }
        else if (content == "오늘컨벤션" || content == "ㅇㄴㅋㅂㅅ" || content == "ㅇㄴㅋㅄ") {
                sqlquery = "select CON_NUMBER, CON_NAME, CON_END, CON_PLACE from COEX_CONVENTION where CON_START <= CURRENT_DATE( ) and CON_END >= CURRENT_DATE( )"
                connection.query(sqlquery, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                if (botsay != "") {
                                        botsay += '\n'
                                }
                                botsay += "컨벤션번호: " + row.CON_NUMBER + "\n" +
                                        '컨벤션명: ' + row.CON_NAME + '\n' +
                                        '종료일: ' + row.CON_END.toLocaleDateString("ko-kr") + '\n' +
                                        '장소: ' + row.CON_PLACE + '\n'
                        })


                        if (botsay == "") {
                                botsay = "오늘 전시가 없습니다."
                        } else {
                                botsay += "\n자세히 보기: 컨벤션자세히 컨벤션번호\n" + today
                        }
                        respkakao(botsay, res)
                })
                connection.end()
        } else if (content == "일주컨벤션" || content == "ㅇㅈㅋㅄ" || content == "ㅇㅈㅋㅂㅅ") {
                sqlquery = "select CON_NUMBER, CON_NAME, CON_START, CON_END from COEX_CONVENTION where CON_START > date_add(now(), interval +0 day) and CON_START <= date_add(now(), interval +7 day)"
                connection.query(sqlquery, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                if (botsay != '') {
                                        botsay += '\n'
                                }
                                botsay += "컨벤션번호: " + row.CON_NUMBER + "\n" +
                                        "컨벤션명: " + row.CON_NAME + "\n" +
                                        "시작일:" + row.CON_START.toLocaleDateString("ko-kr") + "\n" +
                                        "종료일:" + row.CON_END.toLocaleDateString("ko-kr") + "\n"
                        })
                        botsay += "\n자세히 보기: 컨벤션자세히 컨벤션번호"
                        if (botsay == "") {
                                botsay = "컨벤션이 없습니다."
                        }
                        respkakao(botsay, res)
                })
                connection.end()
        } else if (content == "컨벤션" || content == "ㅋㅄ" || content == "ㅋㅂㅅ") {
                botsay = "진행중 : 오늘컨벤션 또는 ㅇㄴㅋㅂㅅ\n " +
                        "Day+7 행사 : 일주컨벤션 또는 ㅇㅈㅋㅂㅅ "
                respkakao(botsay, res)
        } else if (content.indexOf("컨벤션자세히") != -1) {
                var detail = content.split("컨벤션자세히")
                if (detail[1] && detail[1] > 0) {
                        var detailNum = detail[1]
                        sqlquery = "select CON_NUMBER, CON_NAME, CON_START, CON_END, CON_PLACE, CON_HOST, PHONE, EMAIL, HOMEPAGE from COEX_CONVENTION where CON_NUMBER = " + detailNum
                        connection.query(sqlquery, function (err, rows) {
                                if (err) throw errorthrow()
                                Object.keys(rows).forEach(function (key) {
                                        var row = rows[key]
                                        if (botsay != '') {
                                                botsay += '\n'
                                        }
                                        botsay += "컨벤션번호: " + row.CON_NUMBER + "\n" +
                                                "컨벤션명: " + row.CON_NAME + "\n" +
                                                "시작일:" + row.CON_START.toLocaleDateString("ko-kr") + "\n" +
                                                "종료일:" + row.CON_END.toLocaleDateString("ko-kr") + "\n" +
                                                "장소: " + row.CON_PLACE + "\n" +
                                                "주최: " + row.CON_HOST + "\n" +
                                                "전화번호: " + row.PHONE + "\n" +
                                                "EMAIL: " + row.EMAIL + "\n" +
                                                "홈페이지: " + row.HOMEPAGE + "\n"
                                })
                                if (botsay == "") {
                                        botsay = "컨벤션이 없습니다."
                                }
                                respkakao(botsay, res)
                        })
                        connection.end()
                }
                else {
                        respkakao(botsay, res)
                }
        } else if (content == "오크" || content == "ㅇㅋ") {

                botsay = "오크우드 측에서 식단 제공이 불가하다 하여 제공하지 못합니다."
                respkakao(botsay, res)

        }
        else if ((content.indexOf("식단등록") != -1) || (content.indexOf("메뉴등록") != -1)) {
                var admincheck = "admin"
                admincheck = "SELECT UserID from signUser where UserInfo = 'admin'"
                connection.query(admincheck, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                admincheck = row.UserID
                        })
                        tradeadmin = "SELECT UserID from signUser where UserInfo = 'tradeadmin'"
                        connection.query(tradeadmin, function (err, rows) {
                                if (err) throw errorthrow()
                                Object.keys(rows).forEach(function (key) {
                                        var row = rows[key]
                                        tradeadmin = row.UserID
                                })
                                if (user_key == admincheck || user_key == tradeadmin) {
                                        var detail = content.split("식단등록")
                                        var detailmeal = detail[1]
                                        sqlquery = "insert into Gunea (Gunea_MEAL) VALUES('" + detailmeal + "')"

                                        connection.query(sqlquery, function (err, rows) {
                                                if (err) throw errorthrow()
                                        })
                                        botsay = "등록성공."
                                        respkakao(botsay, res)

                                } else {
                                        botsay = "권한이 없습니다."
                                        respkakao(botsay, res)
                                }
                        })
                })
                connection.end()
        } else if (content == "무역" || content == "ㅁㅇ") {
                sqlquery = "select Gunea_TODAY, Gunea_MEAL from Gunea where Gunea_NUMBER = (select MAX(Gunea_NUMBER) from Gunea )"
                connection.query(sqlquery, function (err, rows) {
                        if (err) throw errorthrow()

                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                var t = row.Gunea_TODAY.getDate()
                                var td = new Date()
                                if (t == td.getDate()) {
                                        botsay = today + "\n" + row.Gunea_MEAL
                                }
                        })
                        if (botsay == "" || (botsay == today + "\n")) {
                                botsay = "식단준비중입니다."
                        }
                        respkakao(botsay, res)
                })
                connection.end()


        } else if (content == "ㄺ" || content == "로그") {
                var admincheck = "SELECT UserID from signUser where UserInfo = 'admin'"

                connection.query(admincheck, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                admincheck = row.UserID
                        })
                        if (user_key == admincheck) {
                                sqlquery = "select LOG_NUMBER, LOG_TODAY, LOG_TEXT from LOGTEXT where LOG_NUMBER > (select Max(LOG_NUMBER)-10 from LOGTEXT)"
                                connection.query(sqlquery, function (err, rows) {
                                        if (err) throw errorthrow()
                                        Object.keys(rows).forEach(function (key) {
                                                var row = rows[key]
                                                botsay += row.LOG_NUMBER + " : " + row.LOG_TODAY + "\n" + row.LOG_TEXT + "\n"
                                        })
                                        if (botsay == "") {
                                                botsay = "로그없음"
                                        }
                                        respkakao(botsay, res)
                                })
                        } else {
                                botsay = "권한이 없습니다."
                                respkakao(botsay, res)
                        }
                })
                connection.end()


        } else if (content == "무역센터 권한승인") {
                var admincheck = "admin"
                admincheck = "SELECT UserID from signUser where UserInfo = 'admin'"
                connection.query(admincheck, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                admincheck = row.UserID
                        })
                        if (user_key == admincheck) {
                                tradeuser = "SELECT UserID from signUser where UserInfo = 'tradeuser'"
                                connection.query(tradeuser, function (err, rows) {
                                        if (err) throw errorthrow()
                                        Object.keys(rows).forEach(function (key) {
                                                var row = rows[key]
                                                tradeuser = row.UserID
                                        })
                                        tradeadmin = "UPDATE signUser SET UserID = '" + tradeuser + "' WHERE UserInfo = 'tradeadmin'"
                                        connection.query(tradeadmin, function (err, rows) {
                                                if (err) throw errorthrow()
                                        })
                                })
                                botsay = "무역센터 식단등록 권한이 승인되었습니다."
                                respkakao(botsay, res)
                        } else {
                                botsay = "권한이 없습니다."
                                respkakao(botsay, res)
                        }
                })
                connection.end()

        } else if (content == "무역센터 권한신청") {
                tradeuser = "UPDATE signUser SET UserID = '" + user_key + "' WHERE UserInfo = 'tradeuser'"
                connection.query(tradeuser, function (err, rows) {
                        if (err) throw errorthrow()
                })
                connection.end()
                botsay = "무역센터 식단등록 권한이 신청되었습니다."
                respkakao(botsay, res)

        } else if (content == "라이브모드") {
                var admincheck = "SELECT UserID from signUser where UserInfo = 'liveadmin'"
                connection.query(admincheck, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                admincheck = row.UserID
                        })
                        tradeuser = "UPDATE signUser SET UserID = '" + admincheck + "' WHERE UserInfo = 'admin'"
                        connection.query(tradeuser, function (err, rows) {
                                if (err) throw errorthrow()
                        })
                })
                connection.end()
                botsay = "성공하자서율이"
                respkakao(botsay, res)

        } else if (content == "개발모드") {
                var admincheck = "SELECT UserID from signUser where UserInfo = 'devadmin'"
                connection.query(admincheck, function (err, rows) {
                        if (err) throw errorthrow()
                        Object.keys(rows).forEach(function (key) {
                                var row = rows[key]
                                admincheck = row.UserID
                        })
                        tradeuser = "UPDATE signUser SET UserID = '" + admincheck + "' WHERE UserInfo = 'admin'"
                        connection.query(tradeuser, function (err, rows) {
                                if (err) throw errorthrow()
                        })
                })
                connection.end()
                botsay = "힘내자서율이"
                respkakao(botsay, res)
        } else {
                botsay = "[코엑스인 사용법]\n다음의 키워드를 입력해주세요\n[행사검색]\n 전시, 컨벤션\n[구내식당]\n 무역센터: 무역 or ㅁㅇ"
                respkakao(botsay, res)
        }
        var logsqlquery = "insert into LOGTEXT (LOG_TEXT, LOG_USER) VALUES('" + content + "','" + user_key + "')"

        connection.query(logsqlquery, function (err, rows) {
                if (err) throw errorthrow()
        })
        connection.end()
                      
})
/**
 * 
 * @param {*} botsay 클라이언트에게 전송할 내용
 * @param {*} res response
 */
function respkakao(botsay, res) {
        botmsg = {
                'message': {
                        'text': botsay
                }
        }
        res.set({
                'content-type': 'application/json'
        }).send(JSON.stringify(botmsg))
}
/**
 * 
 * @param {*} res 오류메시지 담아 response 하기위함
 */
function errorthrow(res) {
        botsay = "오류발생! 죄송합니다. 오류가 발생한 기능을 남겨주시면 감사하겠습니다."
        respkakao(botsay, res)
}
app.listen(port, () => {
        console.log('Connect ' + port + ' port!')
})
