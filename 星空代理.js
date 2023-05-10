/**
 * @author 小熊
 * @name 星空代理
 * @origin 小熊
 * @version 1.0.0
 * @description 星空代理
 * @rule (星空签到)$
 * @rule (星空添加账号) ([^\n]+)$
 * @rule (星空删除账号) ([^\n]+)$
 * @priority 99999
 * @admin true
 * @cron 0 0 11 * * *
 * @disable false
  说明：
  使用以下命令设置账户  账号@@密码 多个账号用|分隔
  set XiaoXiongScript xkAccount 13111111111@@123456 
  或者
  星空添加账号 13111111111@@123456 
  星空删除账号 13111111111
 */

const xxTool = require('./mod/xxTool')

module.exports = async s => {
  const sysdb = new BncrDB('XiaoXiongScript')
  let accounts = await sysdb.get('xkAccount', '')
  if (s.param(1) === '星空添加账号') {
    await sysdb.set('xkAccount', accounts === '' ? s.param(2) : `${accounts}|${s.param(2)}`)
    return s.reply('添加账号成功')
  } else if (s.param(1) === '星空删除账号') {
    if (accounts === '') return s.reply('当前没有账号')
    let as = accounts.split('|')
    let ass = as.filter(x => x.split('@@')[0] !== s.param(2))
    if (as.length === ass.length) return s.reply('删除账号不存在')
    await sysdb.set('xkAccount', ass.join('|'))
    return s.reply(`${handleName(s.param(2))} 删除成功`)
  } else if (s.param(1) === '星空签到' || s.getFrom() === 'cron') {
    if (accounts === '') return s.reply('当前没有账号,请添加账号后重试')
    for (item of accounts.split('|')) {
      let acss = item.split('@@')
      if (acss.length !== 2) return s.reply(`${xxTool.handleName(acss[0])} 当前账号异常,请检查`)
      let account = acss[0],
        password = acss[1]
      let cookie = await login(account, password)
      await s.reply(`${xxTool.handleName(account)}: ${await sign(cookie)}`)
    }
  }
}

async function login(username, password) {
  let options = {
    url: 'http://www.xkdaili.com/tools/submit_ajax.ashx?action=user_login&site_id=1',
    method: 'post',
    data: {
      username,
      password,
      remember: '1'
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      Origin: 'http://www.xkdaili.com',
      Referer: 'http://www.xkdaili.com/'
    }
  }
  let res = await xxTool.request(options, true)
  return res && res.data.status === 1 ? res.headers['set-cookie'].map(t => t.split(';')[0]).join('; ') : null
}

async function sign(cookie) {
  let options = {
    url: 'http://www.xkdaili.com/tools/submit_ajax.ashx?action=user_receive_point',
    method: 'post',
    data: {
      type: 'login'
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      Origin: 'http://www.xkdaili.com',
      Referer: 'http://www.xkdaili.com/',
      Cookie: cookie
    }
  }
  let res = await xxTool.request(options)
  return res && res.status === 1 ? '签到成功' : res.msg
}
