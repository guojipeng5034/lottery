import type { Material, Object3D } from 'three'
import type { TargetType } from './type'
import type { IPersonConfig } from '@/types/storeType'
import * as TWEEN from '@tweenjs/tween.js'
import { storeToRefs } from 'pinia'
import { PerspectiveCamera, Scene } from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three-css3d'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useToast } from 'vue-toast-notification'
import dongSound from '@/assets/audio/end.mp3'
import enterAudio from '@/assets/audio/enter.wav'
import worldCupAudio from '@/assets/audio/worldcup.mp3'
import { useElementPosition, useElementStyle } from '@/hooks/useElement'
import { getCachedImageUrl, preloadImages } from '@/hooks/useImageCache'
import i18n from '@/locales/i18n'
import useStore from '@/store'
import { selectCard } from '@/utils'
import { rgba } from '@/utils/color'
import { LotteryStatus } from './type'
import { confettiFire, createSphereVertices, createTableVertices, getRandomElements, initTableData } from './utils'

const maxAudioLimit = 10

/**
 * @description: 拆分名字为英文名和中文名
 * @param name 完整名字，例如 "Gavin郭继朋"
 * @returns { englishName: string, chineseName: string }
 */
function splitName(name: string): { englishName: string; chineseName: string } {
    // 处理空值、null、undefined 等情况
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return { englishName: '', chineseName: '' }
    }

    // 去除首尾空格
    const trimmedName = name.trim()

    // 匹配中文字符的正则表达式（包括中文标点）
    const chineseRegex = /[\u4e00-\u9fa5]/

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
        const englishRegex = /[a-zA-Z]/
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

export function useViewModel() {
    const toast = useToast()
    // store里面存储的值
    const { personConfig, globalConfig, prizeConfig } = useStore()
    const {
        getAllPersonList: allPersonList,
        getNotPersonList: notPersonList,
        getNotThisPrizePersonList: notThisPrizePersonList,
    } = storeToRefs(personConfig)
    const { getCurrentPrize: currentPrize } = storeToRefs(prizeConfig)
    const {
        getCardColor: cardColor,
        getPatterColor: patternColor,
        getPatternList: patternList,
        getTextColor: textColor,
        getLuckyColor: luckyColor,
        getCardSize: cardSize,
        getTextSize: textSize,
        getRowCount: rowCount,
        getIsShowAvatar: isShowAvatar,
        getTitleFont: titleFont,
        getTitleFontSyncGlobal: titleFontSyncGlobal,
        getDefiniteTime: definiteTime,
        getWinMusic: isPlayWinMusic,
    } = storeToRefs(globalConfig)
    // three初始值
    const ballRotationY = ref(0)
    const containerRef = ref<HTMLElement>()
    const canOperate = ref(true)
    const cameraZ = ref(3000)
    const scene = ref()
    const camera = ref()
    const renderer = ref()
    const controls = ref()
    const objects = ref<any[]>([])
    const targets: TargetType = {
        grid: [],
        helix: [],
        table: [],
        sphere: [],
    }
    // 页面数据初始值
    const currentStatus = ref<LotteryStatus>(LotteryStatus.init) // 0为初始状态， 1为抽奖准备状态，2为抽奖中状态，3为抽奖结束状态
    const tableData = ref<any[]>([])
    const luckyTargets = ref<any[]>([])
    const luckyCardList = ref<number[]>([])
    const luckyCount = ref(10)
    const personPool = ref<IPersonConfig[]>([])
    const intervalTimer = ref<any>(null)
    const isInitialDone = ref<boolean>(false)
    const animationFrameId = ref<any>(null)
    const playingAudios = ref<HTMLAudioElement[]>([])
    // 用于标记是否已经播放过获奖音乐，避免多次重叠播放
    const hasPlayedWinMusic = ref<boolean>(false)
    // 用于标记是否已经播放过烟花动画，避免多次播放
    const hasPlayedConfetti = ref<boolean>(false)

    // 抽奖音乐相关
    const lotteryMusic = ref<HTMLAudioElement | null>(null)

    function initThreeJs() {
        const felidView = 40
        const width = window.innerWidth
        const height = window.innerHeight
        const aspect = width / height
        const nearPlane = 1
        const farPlane = 10000
        const WebGLoutput = containerRef.value

        scene.value = new Scene()
        camera.value = new PerspectiveCamera(felidView, aspect, nearPlane, farPlane)
        camera.value.position.z = cameraZ.value
        renderer.value = new CSS3DRenderer()
        renderer.value.setSize(width, height)
        renderer.value.domElement.style.position = 'absolute'
        // 全屏显示
        renderer.value.domElement.style.top = '0'
        renderer.value.domElement.style.left = '0'
        renderer.value.domElement.style.width = '100%'
        renderer.value.domElement.style.height = '100%'
        WebGLoutput!.appendChild(renderer.value.domElement)

        controls.value = new TrackballControls(camera.value, renderer.value.domElement)
        controls.value.rotateSpeed = 1
        controls.value.staticMoving = true
        controls.value.minDistance = 500
        controls.value.maxDistance = 6000
        controls.value.addEventListener('change', render)

        const tableLen = tableData.value.length
        for (let i = 0; i < tableLen; i++) {
            let element = document.createElement('div')
            element.className = 'element-card'

            const number = document.createElement('div')
            number.className = 'card-id'
            number.textContent = tableData.value[i].uid
            if (isShowAvatar.value)
                number.style.display = 'none'
            element.appendChild(number)

            const symbol = document.createElement('div')
            symbol.className = 'card-name'
            if (isShowAvatar.value) {
                // 拆分名字为英文名和中文名
                const { englishName, chineseName } = splitName(tableData.value[i].name)
                // 只有当同时有英文名和中文名时，才使用 card-avatar-name 布局
                if (englishName && chineseName) {
                    symbol.className = 'card-name card-avatar-name'
                    // 创建英文名和中文名的 div
                    const englishNameDiv = document.createElement('div')
                    englishNameDiv.className = 'card-name-english'
                    englishNameDiv.textContent = englishName
                    symbol.appendChild(englishNameDiv)

                    const chineseNameDiv = document.createElement('div')
                    chineseNameDiv.className = 'card-name-chinese'
                    chineseNameDiv.textContent = chineseName
                    symbol.appendChild(chineseNameDiv)
                }
                else {
                    // 只有英文名或只有中文名，使用普通居中布局
                    symbol.className = 'card-name'
                    if (englishName || chineseName) {
                        symbol.textContent = englishName || chineseName
                    }
                    else if (tableData.value[i].name) {
                        // 如果拆分后两个都为空，则显示完整名字（兼容异常情况）
                        symbol.textContent = tableData.value[i].name
                    }
                }
            }
            else {
                symbol.textContent = tableData.value[i].name
            }
            element.appendChild(symbol)

            const detail = document.createElement('div')
            detail.className = 'card-detail'
            detail.innerHTML = `${tableData.value[i].department}<br/>${tableData.value[i].identity}`
            if (isShowAvatar.value)
                detail.style.display = 'none'
            element.appendChild(detail)

            if (isShowAvatar.value) {
                const avatar = document.createElement('img')
                avatar.className = 'card-avatar'
                // 使用缓存的图片URL
                avatar.src = getCachedImageUrl(tableData.value[i].avatar)
                avatar.alt = 'avatar'
                avatar.style.width = '140px'
                avatar.style.height = '140px'
                element.appendChild(avatar)
            }
            else {
                const avatarEmpty = document.createElement('div')
                avatarEmpty.style.display = 'none'
                element.appendChild(avatarEmpty)
            }

            element = useElementStyle(element, tableData.value[i], i, patternList.value, patternColor.value, cardColor.value, cardSize.value, textSize.value)
            const object = new CSS3DObject(element)
            object.position.x = Math.random() * 4000 - 2000
            object.position.y = Math.random() * 4000 - 2000
            object.position.z = Math.random() * 4000 - 2000
            scene.value.add(object)

            objects.value.push(object)
        }
        // 创建横铺的界面
        const tableVertices = createTableVertices({ tableData: tableData.value, rowCount: rowCount.value, cardSize: cardSize.value })
        targets.table = tableVertices
        // 创建球体
        const sphereVertices = createSphereVertices({ objectsLength: objects.value.length })
        targets.sphere = sphereVertices
        window.addEventListener('resize', onWindowResize, false)
        transform(targets.table, 1000)
        render()
    }
    function render() {
        if (renderer.value) {
            renderer.value.render(scene.value, camera.value)
        }
    }
    /**
     * @description: 位置变换
     * @param targets 目标位置
     * @param duration 持续时间
     */
    function transform(targets: any[], duration: number) {
        TWEEN.removeAll()
        if (intervalTimer.value) {
            clearInterval(intervalTimer.value)
            intervalTimer.value = null
            randomBallData('sphere')
        }

        return new Promise((resolve) => {
            const objLength = objects.value.length
            for (let i = 0; i < objLength; ++i) {
                const object = objects.value[i]
                const target = targets[i]
                new TWEEN.Tween(object.position)
                    .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
                    .easing(TWEEN.Easing.Exponential.InOut)
                    .start()

                new TWEEN.Tween(object.rotation)
                    .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
                    .easing(TWEEN.Easing.Exponential.InOut)
                    .start()
                    .onComplete(() => {
                        if (luckyCardList.value.length) {
                            luckyCardList.value.forEach((cardIndex: any) => {
                                const item = objects.value[cardIndex]
                                useElementStyle(item.element, {} as any, i, patternList.value, patternColor.value, cardColor.value, cardSize.value, textSize.value, 'sphere')
                            })
                        }
                        luckyTargets.value = []
                        luckyCardList.value = []
                        canOperate.value = true
                    })
            }

            // 这个补间用来在位置与旋转补间同步执行，通过onUpdate在每次更新数据后渲染scene和camera
            new TWEEN.Tween({})
                .to({}, duration * 2)
                .onUpdate(render)
                .start()
                .onComplete(() => {
                    canOperate.value = true
                    resolve('')
                })
        })
    }
    /**
     * @description: 窗口大小改变时重新设置渲染器的大小
     */
    function onWindowResize() {
        camera.value.aspect = window.innerWidth / window.innerHeight
        camera.value.updateProjectionMatrix()

        renderer.value.setSize(window.innerWidth, window.innerHeight)
        render()
    }

    /**
     * [animation update all tween && controls]
     */
    function animation() {
        TWEEN.update()
        if (controls.value) {
            controls.value.update()
        }
        // 设置自动旋转
        // 设置相机位置
        animationFrameId.value = requestAnimationFrame(animation)
    }
    /**
     * @description: 旋转的动画
     * @param rotateY 绕y轴旋转圈数
     * @param duration 持续时间，单位秒
     */
    function rollBall(rotateY: number, duration: number) {
        TWEEN.removeAll()

        return new Promise((resolve) => {
            scene.value.rotation.y = 0
            ballRotationY.value = Math.PI * rotateY * 1000
            const rotateObj = new TWEEN.Tween(scene.value.rotation)
            rotateObj
                .to(
                    {
                        // x: Math.PI * rotateX * 1000,
                        x: 0,
                        y: ballRotationY.value,
                        // z: Math.PI * rotateZ * 1000
                        z: 0,
                    },
                    duration * 1000,
                )
                .onUpdate(render)
                .start()
                .onStop(() => {
                    resolve('')
                })
                .onComplete(() => {
                    resolve('')
                })
        })
    }
    /**
     * @description: 根据卡片数量调整相机位置和视野
     * @param count 卡片数量
     */
    function adjustCameraForCards(count: number) {
        let targetZ: number
        const targetY = 0

        if (count === 1) {
            // 1个卡片时：相机靠近，更好地显示单个大卡片
            targetZ = 2000
        }
        else if (count <= 10) {
            // 少量卡片（2-10个）：正常距离
            targetZ = 3000
        }
        else if (count <= 20) {
            // 中等数量（11-20个）：相机稍微远离
            targetZ = 3200
        }
        else {
            // 大量卡片（21个以上，如25个）：相机远离，缩小比例，能看到所有卡片
            targetZ = 3500
        }

        new TWEEN.Tween(camera.value.position)
            .to(
                {
                    x: 0,
                    y: targetY,
                    z: targetZ,
                },
                1200,
            )
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(render)
            .start()
    }

    /**
     * @description: 视野转回正面
     */
    function resetCamera() {
        new TWEEN.Tween(camera.value.position)
            .to(
                {
                    x: 0,
                    y: 0,
                    z: 3000,
                },
                1000,
            )
            .onUpdate(render)
            .start()
            .onComplete(() => {
                new TWEEN.Tween(camera.value.rotation)
                    .to(
                        {
                            x: 0,
                            y: 0,
                            z: 0,
                        },
                        1000,
                    )
                    .onUpdate(render)
                    .start()
                    .onComplete(() => {
                        canOperate.value = true
                        // camera.value.lookAt(scene.value.position)
                        camera.value.position.y = 0
                        camera.value.position.x = 0
                        camera.value.position.z = 3000
                        camera.value.rotation.x = 0
                        camera.value.rotation.y = 0
                        camera.value.rotation.z = -0
                        controls.value.reset()
                    })
            })
    }

    /**
     * @description: 开始抽奖音乐
     */
    function startLotteryMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        if (lotteryMusic.value) {
            lotteryMusic.value.pause()
            lotteryMusic.value = null
        }

        lotteryMusic.value = new Audio(worldCupAudio)
        lotteryMusic.value.loop = true
        lotteryMusic.value.volume = 0.7

        lotteryMusic.value.play().catch((error) => {
            console.error('播放抽奖音乐失败:', error)
        })
    }

    /**
     * @description: 停止抽奖音乐
     */
    function stopLotteryMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        if (lotteryMusic.value) {
            lotteryMusic.value.pause()
            lotteryMusic.value = null
        }
    }

    /**
     * @description: 播放结束音效
     */
    function playEndSound() {
        if (!isPlayWinMusic.value) {
            return
        }
        console.log('准备播放结束音效', dongSound)

        // 清理已结束的音频
        playingAudios.value = playingAudios.value.filter(audio => !audio.ended)

        try {
            const endSound = new Audio(dongSound)
            endSound.volume = 1.0

            // 简化播放逻辑
            const playPromise = endSound.play()

            if (playPromise) {
                playPromise
                    .then(() => {
                        console.log('结束音效播放成功')
                        playingAudios.value.push(endSound)
                    })
                    .catch((err) => {
                        console.error('播放失败:', err.name, err.message)
                        if (err.name === 'NotAllowedError') {
                            console.warn('自动播放被阻止，需用户交互后播放')
                        }
                    })
            }

            endSound.onended = () => {
                console.log('结束音效播放完成')
                const index = playingAudios.value.indexOf(endSound)
                if (index > -1)
                    playingAudios.value.splice(index, 1)
            }
        }
        catch (error) {
            console.error('创建音频对象失败:', error)
        }
    }

    /**
     * @description: 重置音频状态
     */
    function resetAudioState() {
        if (!isPlayWinMusic.value) {
            return
        }
        // 停止抽奖音乐
        stopLotteryMusic()

        // 清理所有正在播放的音频
        playingAudios.value.forEach((audio) => {
            if (!audio.ended && !audio.paused) {
                audio.pause()
            }
        })
        playingAudios.value = []
    }

    /**
     * @description: 开始抽奖，由横铺变换为球体（或其他图形）
     * @returns 随机抽取球数据
     */
    /// <IP_ADDRESS>description 进入抽奖准备状态
    async function enterLottery() {
        if (!canOperate.value) {
            return
        }

        // 恢复所有卡片的显示（之前可能被隐藏了）
        objects.value.forEach((obj) => {
            obj.visible = true
        })

        // 重置音频状态
        resetAudioState()

        // 重置相机位置到默认值（Z=3000），确保球体显示完整
        // 当从抽奖结果回到球体时，相机可能被调整过（如1人时相机Z=2000）
        // 使用和 adjustCameraForCards 完全相同的方式来还原相机位置
        const targetZ = 3000 // 默认相机Z位置，对应 adjustCameraForCards 中 count <= 10 的情况
        const targetY = 0

        new TWEEN.Tween(camera.value.position)
            .to(
                {
                    x: 0,
                    y: targetY,
                    z: targetZ,
                },
                1200, // 使用和 adjustCameraForCards 相同的持续时间
            )
            .easing(TWEEN.Easing.Exponential.InOut) // 使用相同的 easing
            .onUpdate(render)
            .start()

        // 预加载音频资源以解决浏览器自动播放策略
        try {
            const audioContext = window.AudioContext || (window as any).webkitAudioContext
            if (audioContext) {
                console.log('音频上下文可用')
            }
        }
        catch (e) {
            console.warn('音频上下文不可用:', e)
        }

        if (!intervalTimer.value) {
            randomBallData()
        }
        if (patternList.value.length) {
            for (let i = 0; i < patternList.value.length; i++) {
                if (i < rowCount.value * 7) {
                    objects.value[patternList.value[i] - 1].element.style.backgroundColor = rgba(cardColor.value, Math.random() * 0.5 + 0.25)
                }
            }
        }
        canOperate.value = false
        await transform(targets.sphere, 1000)
        // 在 transform 完成后，确保相机位置已重置到 3000
        // 因为 transform 会调用 TWEEN.removeAll()，可能移除了相机位置重置动画
        camera.value.position.x = 0
        camera.value.position.y = 0
        camera.value.position.z = 3000
        render()
        currentStatus.value = LotteryStatus.ready
        rollBall(0.1, 2000)
    }
    /**
     * @description 开始抽奖
     */
    function startLottery() {
        if (!canOperate.value) {
            return
        }
        // 验证是否已抽完全部奖项
        if (currentPrize.value.isUsed || !currentPrize.value) {
            toast.open({
                message: i18n.global.t('error.personIsAllDone'),
                type: 'warning',
                position: 'top-right',
                duration: 10000,
            })

            return
        }
        personPool.value = currentPrize.value.isAll ? notThisPrizePersonList.value : notPersonList.value
        // 验证抽奖人数是否还够
        if (personPool.value.length < currentPrize.value.count - currentPrize.value.isUsedCount) {
            toast.open({
                message: i18n.global.t('error.personNotEnough'),
                type: 'warning',
                position: 'top-right',
                duration: 10000,
            })

            return
        }
        // 自定义抽奖个数

        let leftover = currentPrize.value.count - currentPrize.value.isUsedCount
        const customCount = currentPrize.value.separateCount
        if (customCount && customCount.enable && customCount.countList.length > 0) {
            for (let i = 0; i < customCount.countList.length; i++) {
                if (customCount.countList[i].isUsedCount < customCount.countList[i].count) {
                    leftover = customCount.countList[i].count - customCount.countList[i].isUsedCount
                    break
                }
            }
        }
        luckyCount.value = leftover
        // 重构抽奖函数
        luckyTargets.value = getRandomElements(personPool.value, luckyCount.value)
        luckyTargets.value.forEach((item) => {
            const index = personPool.value.findIndex(person => person.id === item.id)
            if (index > -1) {
                personPool.value.splice(index, 1)
            }
        })

        toast.open({
            // message: `现在抽取${currentPrize.value.name} ${leftover}人`,
            message: i18n.global.t('error.startDraw', { count: currentPrize.value.name, leftover }),
            type: 'default',
            position: 'top-right',
            duration: 8000,
        })

        // 开始播放抽奖音乐
        startLotteryMusic()

        currentStatus.value = LotteryStatus.running
        rollBall(10, 3000)
        if (definiteTime.value) {
            setTimeout(() => {
                if (currentStatus.value === LotteryStatus.running) {
                    stopLottery()
                }
            }, definiteTime.value * 1000)
        }
    }
    /**
     * @description: 停止抽奖，抽出幸运人
     */
    async function stopLottery() {
        if (!canOperate.value) {
            return
        }
        // 停止抽奖音乐
        stopLotteryMusic()

        // 播放结束音效
        playEndSound()

        //   clearInterval(intervalTimer.value)
        //   intervalTimer.value = null
        canOperate.value = false
        rollBall(0, 1)

        const windowSize = { width: window.innerWidth, height: window.innerHeight }
        const totalLuckyCount = luckyTargets.value.length

        // 根据卡片数量动态调整卡片大小
        let cardScale = 2 // 默认2倍大小
        let textScale = 2 // 默认2倍文字大小

        if (totalLuckyCount === 1) {
            // 1个卡片时：2.5倍大小
            cardScale = 2.5
            textScale = 2.5
        }
        else if (totalLuckyCount <= 5) {
            // 2-5个卡片：较大（2.5倍）
            cardScale = 2.5
            textScale = 2.5
        }
        else if (totalLuckyCount <= 10) {
            // 6-10个卡片：正常（2倍）
            cardScale = 2
            textScale = 2
        }
        else if (totalLuckyCount <= 25) {
            // 11-25个卡片：1.5倍大小（包括25人）
            cardScale = 1.6
            textScale = 1.6
        }
        else {
            // 26个以上：稍微缩小（1.2倍）
            cardScale = 1.5
            textScale = 1.5
        }

        // 根据卡片数量调整相机位置
        adjustCameraForCards(totalLuckyCount)

        // 重置获奖音乐播放标志
        hasPlayedWinMusic.value = false
        // 重置烟花播放标志
        hasPlayedConfetti.value = false

        luckyTargets.value.forEach((person: IPersonConfig, index: number) => {
            const cardIndex = selectCard(luckyCardList.value, tableData.value.length, person.id)
            luckyCardList.value.push(cardIndex)
            const item = objects.value[cardIndex]
            const finalCardSize = {
                width: cardSize.value.width * cardScale,
                height: cardSize.value.height * cardScale,
            }
            const { xTable, yTable } = useElementPosition(item, rowCount.value, totalLuckyCount, finalCardSize, windowSize, index)
            new TWEEN.Tween(item.position)
                .to({
                    x: xTable,
                    y: yTable,
                    z: 1000,
                }, 1200)
                .easing(TWEEN.Easing.Exponential.InOut)
                .onStart(() => {
                    item.element = useElementStyle(item.element, person, cardIndex, patternList.value, patternColor.value, luckyColor.value, finalCardSize, textSize.value * textScale, 'lucky')
                    // 隐藏所有非中奖的卡片（旋转球体）
                    objects.value.forEach((obj, idx) => {
                        if (!luckyCardList.value.includes(idx)) {
                            obj.visible = false
                        }
                    })
                })
                .start()
                .onComplete(() => {
                    canOperate.value = true
                    currentStatus.value = LotteryStatus.end
                })
            new TWEEN.Tween(item.rotation)
                .to({
                    x: 0,
                    y: 0,
                    z: 0,
                }, 900)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start()
                .onComplete(() => {
                    // 只在第一次动画完成时播放一次获奖音乐，避免多次重叠
                    if (!hasPlayedWinMusic.value) {
                        playWinMusic()
                        hasPlayedWinMusic.value = true
                    }

                    // 只在第一次动画完成时播放一次烟花动画，避免多次播放
                    if (!hasPlayedConfetti.value) {
                        confettiFire()
                        hasPlayedConfetti.value = true
                    }
                    // 不再调用resetCamera，因为已经根据卡片数量调整了相机位置
                })
        })
    }
    // 播放音频，中将卡片越多audio对象越多，声音越大
    function playWinMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        // 清理已结束的音频
        playingAudios.value = playingAudios.value.filter(audio => !audio.ended && !audio.paused)

        if (playingAudios.value.length > maxAudioLimit) {
            console.log('音频播放数量已达到上限，请勿重复播放')
            return
        }

        const enterNewAudio = new Audio(enterAudio)
        enterNewAudio.volume = 0.8

        playingAudios.value.push(enterNewAudio)
        enterNewAudio.play()
            .then(() => {
                // 当音频播放结束后，从数组中移除
                enterNewAudio.onended = () => {
                    const index = playingAudios.value.indexOf(enterNewAudio)
                    if (index > -1) {
                        playingAudios.value.splice(index, 1)
                    }
                }
            })
            .catch((error) => {
                console.error('播放音频失败:', error)
                // 如果播放失败，也从数组中移除
                const index = playingAudios.value.indexOf(enterNewAudio)
                if (index > -1) {
                    playingAudios.value.splice(index, 1)
                }
            })

        // 播放错误时从数组中移除
        enterNewAudio.onerror = () => {
            const index = playingAudios.value.indexOf(enterNewAudio)
            if (index > -1) {
                playingAudios.value.splice(index, 1)
            }
        }
    }
    /**
     * @description: 继续,意味着这抽奖作数，计入数据库
     */
    async function continueLottery() {
        if (!canOperate.value) {
            return
        }
        const customCount = currentPrize.value.separateCount
        if (customCount && customCount.enable && customCount.countList.length > 0) {
            for (let i = 0; i < customCount.countList.length; i++) {
                if (customCount.countList[i].isUsedCount < customCount.countList[i].count) {
                    customCount.countList[i].isUsedCount += luckyCount.value
                    break
                }
            }
        }
        currentPrize.value.isUsedCount += luckyCount.value
        luckyCount.value = 0
        if (currentPrize.value.isUsedCount >= currentPrize.value.count) {
            currentPrize.value.isUsed = true
            currentPrize.value.isUsedCount = currentPrize.value.count
        }
        personConfig.addAlreadyPersonList(luckyTargets.value, currentPrize.value)
        prizeConfig.updatePrizeConfig(currentPrize.value)
        await enterLottery()
    }
    /**
     * @description: 放弃本次抽奖，回到初始状态
     */
    function quitLottery() {
        // 停止抽奖音乐
        stopLotteryMusic()

        enterLottery()
        currentStatus.value = LotteryStatus.init
    }

    /**
     * @description: 随机替换卡片中的数据（不改变原有的值，只是显示）
     * @param {string} mod 模式
     */
    function randomBallData(mod: 'default' | 'lucky' | 'sphere' = 'default') {
        // 两秒执行一次
        intervalTimer.value = setInterval(() => {
            // 产生随机数数组
            const indexLength = 4
            const cardRandomIndexArr: number[] = []
            const personRandomIndexArr: number[] = []
            for (let i = 0; i < indexLength; i++) {
                // 解决随机元素概率过于不均等问题
                const randomCardIndex = Math.floor(Math.random() * (tableData.value.length - 1))
                const randomPersonIndex = Math.floor(Math.random() * (allPersonList.value.length - 1))
                if (luckyCardList.value.includes(randomCardIndex)) {
                    continue
                }
                cardRandomIndexArr.push(randomCardIndex)
                personRandomIndexArr.push(randomPersonIndex)
            }
            for (let i = 0; i < cardRandomIndexArr.length; i++) {
                if (!objects.value[cardRandomIndexArr[i]]) {
                    continue
                }
                objects.value[cardRandomIndexArr[i]].element = useElementStyle(objects.value[cardRandomIndexArr[i]].element, allPersonList.value[personRandomIndexArr[i]], cardRandomIndexArr[i], patternList.value, patternColor.value, cardColor.value, { width: cardSize.value.width, height: cardSize.value.height }, textSize.value, mod, 'change')
            }
        }, 200)
    }
    /**
     * @description: 键盘监听，快捷键操作
     */
    function listenKeyboard(e: any) {
        if ((e.keyCode !== 32 || e.keyCode !== 27) && !canOperate.value) {
            return
        }
        if (e.keyCode === 27 && currentStatus.value === LotteryStatus.running) {
            quitLottery()
        }
        if (e.keyCode !== 32) {
            return
        }
        switch (currentStatus.value) {
            case LotteryStatus.init:
                enterLottery()
                break
            case LotteryStatus.ready:
                startLottery()
                break
            case LotteryStatus.running:
                stopLottery()
                break
            case LotteryStatus.end:
                continueLottery()
                break
            default:
                break
        }
    }
    /**
     * @description: 清理资源，避免内存溢出
     */
    function cleanup() {
        // 停止所有Tween动画
        TWEEN.removeAll()

        // 清理动画循环
        if ((window as any).cancelAnimationFrame) {
            (window as any).cancelAnimationFrame(animationFrameId.value)
        }
        clearInterval(intervalTimer.value)
        intervalTimer.value = null

        // 停止抽奖音乐
        stopLotteryMusic()

        // 清理所有音频资源
        playingAudios.value.forEach((audio) => {
            if (!audio.ended && !audio.paused) {
                audio.pause()
            }
            // 释放音频资源
            audio.src = ''
            audio.load()
        })
        playingAudios.value = []

        if (scene.value) {
            scene.value.traverse((object: Object3D) => {
                if ((object as any).material) {
                    if (Array.isArray((object as any).material)) {
                        (object as any).material.forEach((material: Material) => {
                            material.dispose()
                        })
                    }
                    else {
                        (object as any).material.dispose()
                    }
                }
                if ((object as any).geometry) {
                    (object as any).geometry.dispose()
                }
                if ((object as any).texture) {
                    (object as any).texture.dispose()
                }
            })
            scene.value.clear()
        }

        if (objects.value) {
            objects.value.forEach((object) => {
                if (object.element) {
                    object.element.remove()
                }
            })
            objects.value = []
        }

        if (controls.value) {
            controls.value.removeEventListener('change')
            controls.value.dispose()
        }
        //   移除所有事件监听
        window.removeEventListener('resize', onWindowResize)
        scene.value = null
        camera.value = null
        renderer.value = null
        controls.value = null
    }
    /**
     * @description: 设置默认人员列表
     */
    function setDefaultPersonList() {
        personConfig.setDefaultPersonList()
        // 刷新页面
        window.location.reload()
    }
    const init = () => {
        const startTime = Date.now()
        const maxWaitTime = 2000 // 2秒

        const checkAndInit = () => {
            // 如果人员列表有数据或者等待时间超过2秒，则执行初始化
            if (allPersonList.value.length > 0 || (Date.now() - startTime) >= maxWaitTime) {
                console.log('初始化完成')
                tableData.value = initTableData({ allPersonList: allPersonList.value, rowCount: rowCount.value })
                
                // 预加载所有用户头像到内存缓存
                if (isShowAvatar.value && allPersonList.value.length > 0) {
                    const avatarUrls = allPersonList.value
                        .map((person: IPersonConfig) => person.avatar)
                        .filter((url: string) => url && url.trim() !== '')
                    
                    if (avatarUrls.length > 0) {
                        console.log(`开始预加载 ${avatarUrls.length} 个头像图片...`)
                        preloadImages(avatarUrls, (loaded, total) => {
                            if (loaded === total) {
                                console.log('所有头像图片预加载完成')
                            }
                        }).catch((error) => {
                            console.warn('头像预加载过程中出现错误:', error)
                        })
                    }
                }
                
                initThreeJs()
                animation()
                containerRef.value!.style.color = `${textColor}`
                randomBallData()
                window.addEventListener('keydown', listenKeyboard)
                isInitialDone.value = true
            }
            else {
                console.log('等待人员列表数据...')
                // 继续等待
                setTimeout(checkAndInit, 100) // 每100毫秒检查一次
            }
        }

        checkAndInit()
    }
    onMounted(() => {
        init()
    })
    onUnmounted(() => {
        nextTick(() => {
            cleanup()
        })
        clearInterval(intervalTimer.value)
        intervalTimer.value = null
        window.removeEventListener('keydown', listenKeyboard)
    })

    return {
        setDefaultPersonList,
        startLottery,
        continueLottery,
        quitLottery,
        containerRef,
        stopLottery,
        enterLottery,
        tableData,
        currentStatus,
        isInitialDone,
        titleFont,
        titleFontSyncGlobal,
    }
}
