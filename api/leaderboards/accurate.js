const {GoogleSpreadsheet} = require('google-spreadsheet');
const sheet = new GoogleSpreadsheet('1ADIJvAkL0XHGBDhO7PP9aQOuK3mPIKB2cVPbshuBBHc'); // accurate leaderboard spreadsheet

let forms = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider']
let lastIndex = [{"stars": 0, "coins": 0, "demons": 0}, {"stars": 0, "coins": 0, "demons": 0}]
let caches = [{"stars": null, "coins": null, "demons": null}, {"stars": null, "coins": null, "demons": null}, {"stars": null, "coins": null, "demons": null}] // 0 for JSON, 1 for mods, 2 for GD

module.exports = async (app, req, res, post) => {

      if (req.isGDPS) return res.send(req.server.weeklyLeaderboard ? "-3" : "-2")
      if (!app.sheetsKey) return res.send([])
      let gdMode = post || req.query.hasOwnProperty("gd")
      let modMode = !gdMode && req.query.hasOwnProperty("mod")
      let cache = caches[gdMode ? 2 : modMode ? 1 : 0]

      let type = req.query.type ? req.query.type.toLowerCase() : 'stars'
      if (type == "usercoins") type = "coins"
      if (!["stars", "coins", "demons"].includes(type)) type = "stars"
      if (lastIndex[modMode ? 1 : 0][type] + 600000 > Date.now() && cache[type]) return res.send(gdMode ? cache[type] : JSON.parse(cache[type]))   // 10 min cache

      sheet.useApiKey(app.sheetsKey)
      sheet.loadInfo().then(async () => {
      let tab = sheet.sheetsById[1555821000]
      await tab.loadCells('A2:F2')

      let cellIndex = type == "demons" ? 2 : type == "coins" ? 1 : 0
      if (modMode) cellIndex += 3

      let leaderboard = JSON.parse(tab.getCell(1, cellIndex).value)

      let gdFormatting = ""
      leaderboard.forEach(x => {
        app.userCache(req.id, x.accountID, x.playerID, x.username)
        gdFormatting += `1:${x.username}:2:${x.playerID}:13:${x.coins}:17:${x.usercoins}:6:${x.rank}:9:${x.icon.icon}:10:${x.icon.col1}:11:${x.icon.col2}:14:${forms.indexOf(x.icon.form)}:15:${x.icon.glow ? 2 : 0}:16:${x.accountID}:3:${x.stars}:8:${x.cp}:46:${x.diamonds}:4:${x.demons}|`
      })
      caches[modMode ? 1 : 0][type] = JSON.stringify(leaderboard)
      caches[2][type] = gdFormatting
      lastIndex[modMode ? 1 : 0][type] = Date.now()
      return res.send(gdMode ? gdFormatting : leaderboard)

  })
}