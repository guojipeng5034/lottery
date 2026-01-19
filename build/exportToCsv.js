import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 读取data.js文件
const dataJsPath = path.join(__dirname, '../public/data.js')
const dataJsContent = fs.readFileSync(dataJsPath, 'utf-8')
// 解析JSON数组
const dataArray = JSON.parse(dataJsContent)
console.log(`读取到 ${dataArray.length} 条数据`)

// 映射数据到CSV格式
const csvRows = []

// CSV头部
csvRows.push('uid,name,avatar,department,identity')

// 处理每条数据
dataArray.forEach((item) => {
    const uid = item.user_id || item.open_id || ''
    const name = item.name || ''
    // 优先使用avatar_origin，如果没有则使用avatar_640
    const avatar = item.avatar?.avatar_origin || item.avatar?.avatar_640 || item.avatar?.avatar_240 || ''
    const department = item.department || ''
    const identity = item.identity || ''
    
    // 处理CSV中的特殊字符（逗号、引号、换行符）
    const escapeCsvField = (field) => {
        if (!field) return ''
        // 如果包含逗号、引号或换行符，需要用引号包裹
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            // 将字段中的引号转义为双引号
            return `"${field.replace(/"/g, '""')}"`
        }
        return field
    }
    
    // 构建CSV行
    const row = [
        escapeCsvField(uid),
        escapeCsvField(name),
        escapeCsvField(avatar),
        escapeCsvField(department),
        escapeCsvField(identity),
    ].join(',')
    
    csvRows.push(row)
})

// 生成CSV内容
const csvContent = csvRows.join('\n')

// 保存CSV文件
const outputPath = path.join(__dirname, '../public/person_data.csv')
fs.writeFileSync(outputPath, csvContent, 'utf-8')

console.log(`\n处理完成！已生成CSV文件: ${outputPath}`)
console.log(`共处理 ${dataArray.length} 条数据`)
console.log(`CSV文件大小: ${(csvContent.length / 1024).toFixed(2)} KB`)
