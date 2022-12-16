const path = require("path");
const fs = require("fs-extra");
const nodeXlsx = require("node-xlsx"); //引用node-xlsx模块
const { Parser } = require("json2csv");
const iconv = require("iconv-lite");
let totalJson = {};
let excelBody = [];

// 获取文件路径
const getFiles = (folderPath) => {
  let list = [];
  return new Promise((resolve, reject) => {
    fs.readdirSync(folderPath).map((fileName) => {
      const filedir = path.join(folderPath, fileName);
      list.push(filedir);
    });
    resolve(list);
  });
};

// 获取文件夹中的excel文件
const getExcel = async (excelPath) => {
  if (excelPath.includes("~")) {
    return;
  }
  const regex = /\d{4}.\d*/;
  const matchResult = excelPath.match(regex);
  if (!matchResult || matchResult.length < 1) {
    return;
  }
  const date = matchResult && matchResult[0];
  totalJson[date] = {};
  //下方ex1是读取出来的数组，数组长度取决于Excel文件的工作表(sheet)
  const ex1 = nodeXlsx.parse(excelPath); //读取excel表格
  let excelContent = ex1[0].data; //取出excel文件中的第一个工作表中的全部数据
  excelContent.splice(0, 1); //一般来说表中的第一条数据可能是标题没有用，所以删掉
  for await (const item of excelContent) {
    let name = item[3];
    let count = item[item.length - 1];
    if (name && count) {
      count = count.split("天")[0];
      totalJson[date][name] = parseInt(count);
    }
  }
};

// 转换成excel
async function convert(data) {
  const dateList = Object.keys(data);
  const fields = ["姓名", ...dateList, "合计 (天)"];
  const opts = { fields };
  // json模板
  let jsonTemp = {
    姓名: "",
  };
  for (const month of dateList) {
    jsonTemp[month] = 0;
  }

  for (const date in data) {
    const monthData = data[date];
    // 遍历每个月的数据
    for (const name in monthData) {
      const count = monthData[name];
      // 判断body中是否已经存在该人员数据
      let json = excelBody.find((v) => v["姓名"] == name);
      if (json && json["姓名"]) {
        json[date] = count;
      } else {
        json = jsonTemp;
        json["姓名"] = name;
        json[date] = count;
        let param = Object.assign({}, json);
        excelBody.push(param);
      }
    }
  }

  // 计算合计
  for (const worker of excelBody) {
    let countAll = 0;
    const values = Object.values(worker);
    for (const item of values) {
      if (typeof item === "number") {
        countAll += item;
      }
    }
    worker["合计 (天)"] = countAll;
  }

  try {
    const parser = new Parser(opts);
    console.log(excelBody);
    const csv = await parser.parse(excelBody);
    return csv;
  } catch (err) {
    console.error(err);
  }
}
// 生成文件
async function saveCsv(csv) {
  const savePath = path.join(process.cwd(), `output/统计表.csv`);
  await fs.ensureFile(savePath);
  // 把中文转换成字节数组
  const newCsv = iconv.encode(csv, "gbk");
  fs.writeFile(savePath, newCsv, function (err) {
    if (err) throw err;
    console.log("File saved.");
  });
}

async function init() {
  const excelList = await getFiles("./excel/");
  for await (const file of excelList) {
    await getExcel(file);
  }
  const csv = await convert(totalJson);
  await saveCsv(csv);
}

init();
