import type { IPersonConfig } from '@/types/storeType'
import { rgba } from '@/utils/color'
import { getCachedImageUrl } from './useImageCache'

/**
 * @description: 拆分名字为英文名和中文名
 * @param name 完整名字，例如 "Gavin郭继朋"
 * @returns { englishName: string; chineseName: string }
 */
function splitName(name: string): { englishName: string; chineseName: string } {
    // 处理空值、null、undefined 等情况
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return { englishName: '', chineseName: '' }
    }

    // 去除首尾空格
    const trimmedName = name.trim()

    // 匹配中文字符的正则表达式（包括中文标点）
    const chineseRegex = /[\u4E00-\u9FA5]/

    // 找到第一个中文字符的位置
    let firstChineseIndex = -1
    for (let i = 0; i < trimmedName.length; i++) {
        if (chineseRegex.test(trimmedName[i])) {
            firstChineseIndex = i
            break
        }
    }

    if (firstChineseIndex === -1) {
        // 没有中文字符，全部作为英文名（可能是纯英文、数字、符号等）
        return { englishName: trimmedName, chineseName: '' }
    }

    // 如果第一个字符就是中文，说明是纯中文名或中文在前的情况
    if (firstChineseIndex === 0) {
        // 检查是否包含英文（可能有 "郭继朋Gavin" 这种格式，虽然不常见）
        const englishRegex = /[a-z]/i
        let hasEnglish = false
        for (let i = 0; i < trimmedName.length; i++) {
            if (englishRegex.test(trimmedName[i])) {
                hasEnglish = true
                break
            }
        }

        if (!hasEnglish) {
            // 纯中文名，没有英文
            return { englishName: '', chineseName: trimmedName }
        }
    }

    // 正常拆分：英文名在前，中文名在后
    const englishName = trimmedName.substring(0, firstChineseIndex).trim()
    const chineseName = trimmedName.substring(firstChineseIndex).trim()

    return { englishName, chineseName }
}

export function useElementStyle(element: any, person: IPersonConfig, index: number, patternList: number[], patternColor: string, cardColor: string, cardSize: { width: number, height: number }, textSize: number, mod: 'default' | 'lucky' | 'sphere' = 'default', type: 'add' | 'change' = 'add') {
    if (patternList.includes(index + 1) && mod === 'default') {
        element.style.backgroundColor = rgba(patternColor, Math.random() * 0.2 + 0.8)
    }
    else if (mod === 'sphere' || mod === 'default') {
        element.style.backgroundColor = rgba(cardColor, Math.random() * 0.5 + 0.25)
    }
    else if (mod === 'lucky') {
        element.style.backgroundColor = rgba(cardColor, 0.8)
    }
    element.style.border = `1px solid ${rgba(cardColor, 0.25)}`
    element.style.boxShadow = `0 0 12px ${rgba(cardColor, 0.5)}`
    element.style.width = `${cardSize.width}px`
    element.style.height = `${cardSize.height}px`
    if (mod === 'lucky') {
        element.className = 'lucky-element-card'
    }
    else {
        element.className = 'element-card'
    }
    if (type === 'add') {
        element.addEventListener('mouseenter', (ev: MouseEvent) => {
            const target = ev.target as HTMLElement
            target.style.border = `1px solid ${rgba(cardColor, 0.75)}`
            target.style.boxShadow = `0 0 12px ${rgba(cardColor, 0.75)}`
        })
        element.addEventListener('mouseleave', (ev: MouseEvent) => {
            const target = ev.target as HTMLElement
            target.style.border = `1px solid ${rgba(cardColor, 0.25)}`
            target.style.boxShadow = `0 0 12px ${rgba(cardColor, 0.5)}`
        })
    }
    element.children[0].style.fontSize = `${textSize * 0.5}px`
    if (person.uid) {
        element.children[0].textContent = person.uid
    }

    element.children[1].style.fontSize = `${textSize}px`
    element.children[1].style.textShadow = `0 0 12px ${rgba(cardColor, 0.95)}`
    // 检查是否有头像
    const hasAvatar = element.children[3] && element.children[3].tagName === 'IMG' && person.avatar

    if (person.name) {
        // 拆分名字为英文名和中文名
        const { englishName, chineseName } = splitName(person.name)
        // 检查是否是头像模式（有 card-avatar-name 类名）
        const isAvatarMode = element.children[1].classList.contains('card-avatar-name')

        // 只有当同时有英文名和中文名时，才使用 card-avatar-name 布局
        if (englishName && chineseName) {
            // 如果当前不是头像模式，切换到头像模式
            if (!isAvatarMode) {
                element.children[1].className = 'card-name card-avatar-name'
                // 清理现有内容
                element.children[1].textContent = ''
            }
            // 头像模式：使用 flex 布局实现上下居中
            element.children[1].style.display = 'flex'
            element.children[1].style.flexDirection = 'column'
            element.children[1].style.alignItems = 'center'
            element.children[1].style.justifyContent = 'center'
            element.children[1].style.width = '100%'
            element.children[1].style.maxWidth = '100%'
            element.children[1].style.boxSizing = 'border-box'
            // 如果有头像，名字显示在头像下方
            if (hasAvatar) {
                if (mod === 'lucky') {
                    // 抽中卡片时，头像在顶部，宽度100%，名字在头像下方
                    // 假设头像高度约为卡片高度的60%，名字在头像下方10px处
                    element.children[1].style.top = 'calc(60% + 10px)'
                    element.children[1].style.bottom = '15px'
                    element.children[1].style.left = '0'
                    element.children[1].style.right = '0'
                    element.children[1].style.transform = 'none'
                }
                else {
                    // 普通模式：头像在35%位置，高度140px，名字在头像下方
                    element.children[1].style.top = 'calc(35% + 80px)'
                    element.children[1].style.bottom = '15px'
                    element.children[1].style.left = '0'
                    element.children[1].style.right = '0'
                    element.children[1].style.transform = 'none'
                }
            }
            else {
                // 没有头像时，使用 flex 布局全屏居中
                element.children[1].style.top = '0'
                element.children[1].style.bottom = '0'
                element.children[1].style.left = '0'
                element.children[1].style.right = '0'
                element.children[1].style.transform = 'none'
            }

            // 查找现有的英文名和中文名元素
            let englishDiv: HTMLElement | null = null
            let chineseDiv: HTMLElement | null = null

            for (let i = 0; i < element.children[1].children.length; i++) {
                const child = element.children[1].children[i] as HTMLElement
                if (child.classList.contains('card-name-english')) {
                    englishDiv = child
                }
                else if (child.classList.contains('card-name-chinese')) {
                    chineseDiv = child
                }
            }

            // 更新或创建英文名元素
            if (englishDiv) {
                englishDiv.textContent = englishName
                englishDiv.style.fontSize = `${textSize}px`
                englishDiv.style.textShadow = `0 0 12px ${rgba(cardColor, 0.95)}`
            }
            else {
                englishDiv = document.createElement('div')
                englishDiv.className = 'card-name-english'
                englishDiv.textContent = englishName
                englishDiv.style.fontSize = `${textSize}px`
                englishDiv.style.textShadow = `0 0 12px ${rgba(cardColor, 0.95)}`
                // 设置换行样式，允许在容器宽度不够时换行
                englishDiv.style.whiteSpace = 'normal'
                englishDiv.style.wordBreak = 'break-word'
                englishDiv.style.overflowWrap = 'break-word'
                englishDiv.style.maxWidth = '100%'
                englishDiv.style.width = '100%'
                englishDiv.style.boxSizing = 'border-box'
                // 如果中文名元素已存在，在其前面插入；否则直接追加
                if (chineseDiv) {
                    element.children[1].insertBefore(englishDiv, chineseDiv)
                }
                else {
                    element.children[1].appendChild(englishDiv)
                }
            }

            // 更新或创建中文名元素
            if (chineseDiv) {
                chineseDiv.textContent = chineseName
                chineseDiv.style.fontSize = `${textSize}px`
                chineseDiv.style.textShadow = `0 0 12px ${rgba(cardColor, 0.95)}`
            }
            else {
                chineseDiv = document.createElement('div')
                chineseDiv.className = 'card-name-chinese'
                chineseDiv.textContent = chineseName
                chineseDiv.style.fontSize = `${textSize}px`
                chineseDiv.style.textShadow = `0 0 12px ${rgba(cardColor, 0.95)}`
                // 设置换行样式，允许在容器宽度不够时换行
                chineseDiv.style.whiteSpace = 'normal'
                chineseDiv.style.wordBreak = 'break-word'
                chineseDiv.style.overflowWrap = 'break-word'
                chineseDiv.style.maxWidth = '100%'
                chineseDiv.style.width = '100%'
                chineseDiv.style.boxSizing = 'border-box'
                element.children[1].appendChild(chineseDiv)
            }
        }
        else {
            // 只有英文名或只有中文名，使用普通居中布局
            // 如果当前是头像模式，需要切换到普通模式
            if (isAvatarMode) {
                element.children[1].className = 'card-name'
                // 清理所有子元素（英文名和中文名的div）
                while (element.children[1].firstChild) {
                    element.children[1].firstChild.remove()
                }
            }
            // 设置正常行高以支持居中
            element.children[1].style.lineHeight = 'normal'
            // 使用 flex 布局实现上下居中
            element.children[1].style.display = 'flex'
            element.children[1].style.alignItems = 'center'
            element.children[1].style.justifyContent = 'center'
            element.children[1].style.width = '100%'
            element.children[1].style.maxWidth = '100%'
            element.children[1].style.boxSizing = 'border-box'
            // 显示名字（优先显示存在的部分）
            const nameText = englishName || chineseName || person.name
            // 如果名字容器内没有文本节点，创建一个包装元素
            let textWrapper = element.children[1].querySelector('.card-name-text')
            if (!textWrapper) {
                // 清理现有内容
                element.children[1].textContent = ''
                textWrapper = document.createElement('span')
                textWrapper.className = 'card-name-text'
                element.children[1].appendChild(textWrapper)
            }
            textWrapper.textContent = nameText
            // 设置文本换行相关样式
            textWrapper.style.whiteSpace = 'normal'
            textWrapper.style.wordBreak = 'break-word'
            textWrapper.style.overflowWrap = 'break-word'
            textWrapper.style.textAlign = 'center'
            textWrapper.style.maxWidth = '100%'
            textWrapper.style.width = '100%'
            textWrapper.style.boxSizing = 'border-box'
            // 如果有头像，名字显示在头像下方
            if (hasAvatar) {
                if (mod === 'lucky') {
                    // 抽中卡片时，头像在顶部，宽度100%，名字在头像下方
                    // 假设头像高度约为卡片高度的60%，名字在头像下方10px处
                    element.children[1].style.top = 'calc(60% + 10px)'
                    element.children[1].style.bottom = '15px'
                    element.children[1].style.left = '0'
                    element.children[1].style.right = '0'
                    element.children[1].style.transform = 'none'
                }
                else {
                    // 普通模式：头像在35%位置，高度140px，名字在头像下方
                    element.children[1].style.top = 'calc(35% + 80px)'
                    element.children[1].style.bottom = '15px'
                    element.children[1].style.left = '0'
                    element.children[1].style.right = '0'
                    element.children[1].style.transform = 'none'
                }
            }
            else {
                // 没有头像时，使用 flex 布局全屏居中
                element.children[1].style.top = '0'
                element.children[1].style.bottom = '0'
                element.children[1].style.left = '0'
                element.children[1].style.right = '0'
                element.children[1].style.transform = 'none'
            }
        }
    }
    else {
        // 如果没有名字，也设置正常行高
        element.children[1].style.lineHeight = 'normal'
        // 如果当前是头像模式，切换到普通模式
        if (element.children[1].classList.contains('card-avatar-name')) {
            element.children[1].className = 'card-name'
            // 清理所有子元素
            while (element.children[1].firstChild) {
                element.children[1].firstChild.remove()
            }
        }
    }
    // element.children[2].style.fontSize = `${textSize * 0.5}px`
    // if (person.department || person.identity) {
    //     element.children[2].innerHTML = `${person.department ? person.department : ''}<br/>${person.identity ? person.identity : ''}`
    // }

    element.children[2].style.fontSize = `${textSize * 0.5}px`
    // 设置部门和身份的默认值
    element.children[2].innerHTML = ''
    if (person.department || person.identity) {
        element.children[2].innerHTML = `${person.department ? person.department : ''}<br/>${person.identity ? person.identity : ''}`
    }

    // 设置头像，如果是头像模式，确保头像自适应居中显示
    if (element.children[3] && element.children[3].tagName === 'IMG') {
        // 使用缓存的图片URL
        element.children[3].src = getCachedImageUrl(person.avatar)
        // 头像自适应居中：根据卡片大小动态设置头像尺寸
        if (mod === 'lucky') {
            // 抽中卡片时，头像位于顶部，宽度100%
            element.children[3].style.position = 'absolute'
            element.children[3].style.width = '100%'
            element.children[3].style.height = 'auto'
            element.children[3].style.objectFit = 'cover'
        }
        else {
            // 普通模式保持原有设置
            element.children[3].style.width = '140px'
            element.children[3].style.height = '140px'
        }
    }

    return element
}

/**
 * @description 设置抽中卡片的位置
 * 支持任意数量的卡片，自动计算布局，保持从中心向两侧对称排列的效果
 * 1个卡片时完全居中，多个卡片时根据数量自适应布局
 */
export function useElementPosition(element: any, count: number, totalCount: number, cardSize: { width: number, height: number }, windowSize: { width: number, height: number }, cardIndex: number) {
    // 特殊处理：只有1个卡片时，完全居中
    if (totalCount === 1) {
        return { xTable: 0, yTable: 0 }
    }

    let xTable = 0
    let yTable = 0

    // 根据卡片大小和数量动态调整卡片间距
    // 卡片越多，间距越小，以便能看到所有卡片
    let cardSpacing: number
    if (totalCount <= 5) {
        cardSpacing = 100 // 少量卡片：正常间距
    }
    else if (totalCount <= 10) {
        cardSpacing = 80 // 中等数量：稍微缩小间距
    }
    else if (totalCount <= 20) {
        cardSpacing = 60 // 较多卡片：进一步缩小间距
    }
    else {
        // 大量卡片（21个以上）：最小间距，类似鼠标滚轮缩小
        cardSpacing = 40
    }

    // 计算每行最多显示的卡片数（根据屏幕宽度动态调整）
    const horizontalMargin = 200 // 左右边距
    const maxCardsPerRow = Math.floor((windowSize.width - horizontalMargin) / (cardSize.width + cardSpacing))

    // 根据卡片总数和屏幕宽度确定每行卡片数
    // 少量卡片（<=10）时保持每行5个，多卡片时根据屏幕宽度和总数自动调整
    let cardsPerRow: number
    if (totalCount <= 10) {
        cardsPerRow = 5 // 少量卡片保持原有布局
    }
    else if (totalCount <= 20) {
        cardsPerRow = Math.max(5, Math.min(6, maxCardsPerRow)) // 6个一行
    }
    else if (totalCount <= 24) {
        // 21-24个：根据屏幕宽度自适应，但不超过合理范围（每行6-8个）
        cardsPerRow = Math.max(6, Math.min(8, maxCardsPerRow))
    }
    else {
        // 25个以上：增加一列显示（每行7-9个）
        cardsPerRow = Math.max(7, Math.min(9, maxCardsPerRow))
    }

    // 计算总行数
    const totalRows = Math.ceil(totalCount / cardsPerRow)

    // 计算当前卡片所在的行和列
    const currentRow = Math.floor(cardIndex / cardsPerRow)
    const currentCol = cardIndex % cardsPerRow

    // 行间距：根据卡片数量调整，确保所有卡片都能看到
    let rowSpacing: number
    if (totalCount <= 10) {
        rowSpacing = cardSize.height + 60
    }
    else if (totalCount <= 20) {
        rowSpacing = cardSize.height + 40
    }
    else {
        // 大量卡片：缩小行间距
        rowSpacing = cardSize.height + 20
    }

    // 计算当前行的卡片数量
    const cardsInCurrentRow = currentRow === totalRows - 1 ? totalCount - currentRow * cardsPerRow : cardsPerRow

    // 计算x坐标：从中心向两侧对称排列（保持原有效果）
    if (cardsInCurrentRow % 2 === 1) {
        // 奇数个卡片：中心一个，然后左右对称
        // 计算距离中心的偏移量（0为中心，-2, -1, 0, 1, 2...）
        const centerOffset = currentCol - Math.floor(cardsInCurrentRow / 2)
        xTable = centerOffset * (cardSize.width + cardSpacing)
    }
    else {
        // 偶数个卡片：从中心两侧对称排列
        // 例如：4个卡片，位置为 -1.5, -0.5, 0.5, 1.5
        const centerOffset = currentCol - (cardsInCurrentRow - 1) / 2
        xTable = centerOffset * (cardSize.width + cardSpacing)
    }

    // 计算y坐标：在Three.js中，y轴正方向向上
    // 第一排应该在最上方（y值最大），然后向下排列（y值递减）
    // 相机默认在z=3000，看向原点，所以y=0在屏幕中心

    // 根据卡片数量和总行数计算baseY，确保所有卡片都能在可视范围内并居中显示
    let baseY: number
    if (totalRows === 1) {
        // 只有一行：完全居中显示
        baseY = 0
    }
    else if (totalRows === 2) {
        // 2行：计算居中位置，让两行的中心在y=0附近
        // 第一行在 baseY，第二行在 baseY - rowSpacing
        // 中心位置 = baseY - rowSpacing / 2，要让中心在0，需要 baseY = rowSpacing / 2
        baseY = rowSpacing / 2
    }
    else if (totalRows === 3) {
        // 3行：计算居中位置，让三行的中心在y=0附近
        // 第一行在 baseY，第二行在 baseY - rowSpacing，第三行在 baseY - 2 * rowSpacing
        // 中心位置 = baseY - rowSpacing，要让中心在0，需要 baseY = rowSpacing
        baseY = rowSpacing
    }
    else if (totalRows <= 5) {
        // 4-5行：从上方开始排列，但也要尽量居中
        // 计算总高度，然后让中心在y=0附近
        const totalHeight = (totalRows - 1) * rowSpacing
        baseY = totalHeight / 2
    }
    else {
        // 大量卡片（超过5行）：第一排固定在顶部可见位置
        // 相机已经远离，所以可以放置更多行
        const maxBaseY = 600
        baseY = Math.min(400 + (totalRows - 3) * rowSpacing * 0.15, maxBaseY)
    }

    // 第一排（currentRow=0）在最上方，后面的行向下排列（y值递减）
    yTable = baseY - currentRow * rowSpacing

    return { xTable, yTable }
}
