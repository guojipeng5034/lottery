import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { JSDOM } from 'jsdom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.join(__dirname, '../dist-file')
const htmlPath = path.join(distDir, 'index.html')

console.log('开始内联资源到 HTML...')

// 读取 HTML 文件
const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
const dom = new JSDOM(htmlContent)
const document = dom.window.document

// 处理 CSS 文件
const linkTags = document.querySelectorAll('link[rel="stylesheet"]')
console.log(`找到 ${linkTags.length} 个 CSS 文件`)

linkTags.forEach((link) => {
    const href = link.getAttribute('href')
    if (!href || href.startsWith('data:')) return

    const cssPath = path.resolve(distDir, href.replace(/^\.\//, ''))
    try {
        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf-8')
            const styleTag = document.createElement('style')
            styleTag.textContent = cssContent
            link.replaceWith(styleTag)
            console.log(`✓ 内联 CSS: ${href}`)
        }
        else {
            console.warn(`⚠ CSS 文件不存在: ${cssPath}`)
        }
    }
    catch (error) {
        console.error(`✗ 读取 CSS 文件失败: ${cssPath}`, error)
    }
})

// 处理 JS 文件 - 将 ES modules 转换为普通 script
const scriptTags = document.querySelectorAll('script[type="module"]')
console.log(`找到 ${scriptTags.length} 个 JS Module 文件`)

const jsContents = []
const modulePreloadLinks = document.querySelectorAll('link[rel="modulepreload"]')

// 收集所有需要加载的模块
const moduleFiles = new Set()
scriptTags.forEach((script) => {
    const src = script.getAttribute('src')
    if (src) {
        moduleFiles.add(src)
    }
})

modulePreloadLinks.forEach((link) => {
    const href = link.getAttribute('href')
    if (href) {
        moduleFiles.add(href)
    }
})

// 按顺序加载模块（从入口文件开始）
const entryScript = scriptTags[0]?.getAttribute('src')
if (entryScript) {
    // 构建依赖图并加载
    const loadModule = (src) => {
        const jsPath = path.resolve(distDir, src.replace(/^\.\//, ''))
        if (fs.existsSync(jsPath) && !jsContents.find(c => c.path === jsPath)) {
            try {
                const jsContent = fs.readFileSync(jsPath, 'utf-8')
                jsContents.push({ path: jsPath, src, content: jsContent })
                console.log(`✓ 读取 JS: ${src}`)

                // 查找 import 语句
                const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g
                let match
                while ((match = importRegex.exec(jsContent)) !== null) {
                    const importPath = match[1]
                    if (importPath.startsWith('./') || importPath.startsWith('../')) {
                        const resolvedPath = path.resolve(path.dirname(jsPath), importPath)
                        if (fs.existsSync(resolvedPath)) {
                            const relativePath = path.relative(distDir, resolvedPath).replace(/\\/g, '/')
                            const relativeSrc = './' + relativePath
                            if (!moduleFiles.has(relativeSrc)) {
                                moduleFiles.add(relativeSrc)
                                loadModule(relativeSrc)
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error(`✗ 读取 JS 文件失败: ${jsPath}`, error)
            }
        }
    }

    // 加载入口模块及其依赖
    loadModule(entryScript)
    moduleFiles.forEach(loadModule)
}

// 移除所有 script 和 modulepreload 标签
scriptTags.forEach(script => script.remove())
modulePreloadLinks.forEach(link => link.remove())

// 将合并后的 JS 添加为普通 script 标签（非 module）
if (jsContents.length > 0) {
    const combinedJs = jsContents.map(item => item.content).join('\n\n')
    const scriptTag = document.createElement('script')
    scriptTag.textContent = combinedJs
    document.body.appendChild(scriptTag)
    console.log(`✓ 内联 ${jsContents.length} 个 JS 文件`)
}

// 移除 legacy 相关脚本（不再需要）
const legacyScripts = document.querySelectorAll('script[nomodule], script[id*="legacy"]')
legacyScripts.forEach(script => script.remove())

// 保存处理后的 HTML
const finalHtml = dom.serialize()
fs.writeFileSync(htmlPath, finalHtml, 'utf-8')

console.log('✓ 资源内联完成！')
console.log(`✓ HTML 文件已更新: ${htmlPath}`)
