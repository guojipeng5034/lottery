import { onUnmounted, ref } from 'vue'

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: () => void
    stop: () => void
    abort: () => void
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
}

interface SpeechRecognitionEvent {
    resultIndex: number
    results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
    error: string
    message: string
}

interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
}

/**
 * 语音识别 composable
 * @param onResult 识别结果回调函数
 * @param keywords 关键词数组，识别到关键词时会触发回调
 * @param autoRestart 是否在识别结束时自动重启（默认 false）
 * @param onInterimResult 实时识别结果回调函数（用于显示中间结果）
 */
export function useSpeechRecognition(
    onResult: (text: string) => void,
    keywords: string[] = [],
    autoRestart: boolean = false,
    onInterimResult?: (text: string) => void
) {
    const isSupported = ref(false)
    const isListening = ref(false)
    const recognition = ref<SpeechRecognition | null>(null)
    const error = ref<string | null>(null)
    const shouldListen = ref(false) // 标记是否应该继续监听
    const currentTranscript = ref<string>('') // 当前识别的文字
    let lastTriggeredText = '' // 上次触发的文字，用于防重复
    let triggerTimeout: number | null = null // 触发防抖定时器

    // 检查浏览器是否支持语音识别
    const checkSupport = () => {
        const SpeechRecognition = (globalThis as Window).SpeechRecognition || (globalThis as Window).webkitSpeechRecognition
        isSupported.value = !!SpeechRecognition
        return isSupported.value
    }

    // 初始化语音识别
    const initRecognition = () => {
        if (!checkSupport()) {
            error.value = '浏览器不支持语音识别功能'
            return false
        }

        try {
            const SpeechRecognition = (globalThis as Window).SpeechRecognition || (globalThis as Window).webkitSpeechRecognition
            if (!SpeechRecognition) {
                error.value = '无法创建语音识别实例'
                return false
            }

            recognition.value = new SpeechRecognition()
            recognition.value.continuous = true // 持续监听
            recognition.value.interimResults = true // 返回中间结果，用于实时显示
            recognition.value.lang = 'zh-CN' // 设置为中文

            // 识别结果处理
            recognition.value.onresult = (event: SpeechRecognitionEvent) => {
                let interimTranscript = ''
                let finalTranscript = ''
                
                // 遍历所有识别结果
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript.trim()
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript
                    }
                    else {
                        interimTranscript += transcript
                    }
                }

                // 实时显示识别文字（包括中间结果）
                const displayText = finalTranscript || interimTranscript
                if (displayText) {
                    currentTranscript.value = displayText
                    if (onInterimResult) {
                        onInterimResult(displayText)
                    }
                }

                // 检查关键词匹配（包括中间结果，实现快速响应）
                const checkKeywords = (text: string) => {
                    if (!text || keywords.length === 0) {
                        return false
                    }
                    const matchedKeyword = keywords.find(keyword => 
                        text.includes(keyword)
                    )
                    return matchedKeyword !== undefined
                }

                // 优先检查中间结果，如果匹配到关键词立即触发（快速响应）
                if (interimTranscript && checkKeywords(interimTranscript)) {
                    // 防重复触发：如果和上次触发的文字相同或相似，则跳过
                    if (interimTranscript === lastTriggeredText || 
                        lastTriggeredText && interimTranscript.includes(lastTriggeredText)) {
                        return
                    }
                    
                    // 清除之前的防抖定时器
                    if (triggerTimeout !== null) {
                        clearTimeout(triggerTimeout)
                    }
                    
                    // 立即触发，不等待
                    console.log('中间结果匹配到关键词，立即触发:', interimTranscript)
                    lastTriggeredText = interimTranscript
                    onResult(interimTranscript)
                    
                    // 清空当前识别文字
                    currentTranscript.value = ''
                    if (onInterimResult) {
                        onInterimResult('')
                    }
                    
                    // 设置一个短暂的防抖，避免同一句话重复触发
                    triggerTimeout = setTimeout(() => {
                        lastTriggeredText = ''
                        triggerTimeout = null
                    }, 1000) as unknown as number
                    
                    return // 立即返回，不等待最终结果
                }

                // 最终结果处理
                if (finalTranscript) {
                    console.log('语音识别最终结果:', finalTranscript)
                    
                    // 如果中间结果已经触发过，且最终结果包含相同关键词，则跳过
                    if (lastTriggeredText && finalTranscript.includes(lastTriggeredText)) {
                        // 重置标记，准备下次识别
                        lastTriggeredText = ''
                        if (triggerTimeout !== null) {
                            clearTimeout(triggerTimeout)
                            triggerTimeout = null
                        }
                        currentTranscript.value = ''
                        if (onInterimResult) {
                            onInterimResult('')
                        }
                        return
                    }
                    
                    // 如果有关键词，检查是否匹配
                    if (keywords.length > 0) {
                        if (checkKeywords(finalTranscript)) {
                            console.log('最终结果匹配到关键词:', finalTranscript)
                            lastTriggeredText = finalTranscript
                            onResult(finalTranscript)
                        }
                    } else {
                        // 没有关键词限制，直接返回结果
                        onResult(finalTranscript)
                    }
                    
                    // 清空当前识别文字
                    currentTranscript.value = ''
                    if (onInterimResult) {
                        onInterimResult('')
                    }
                    
                    // 重置触发标记
                    lastTriggeredText = ''
                    if (triggerTimeout !== null) {
                        clearTimeout(triggerTimeout)
                        triggerTimeout = null
                    }
                }
            }

            // 错误处理
            recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('语音识别错误:', event.error, event.message)
                error.value = event.message || event.error
                
                // 某些错误可以自动恢复
                if (event.error === 'no-speech' || event.error === 'audio-capture') {
                    // 静默错误，不中断监听
                    return
                }
                
                // 其他错误可能需要停止监听
                if (event.error === 'not-allowed') {
                    error.value = '麦克风权限被拒绝，请允许访问麦克风'
                    stop()
                } else if (event.error === 'network') {
                    error.value = '网络错误，请检查网络连接'
                }
            }

            // 监听结束事件
            recognition.value.onend = () => {
                console.log('语音识别已结束')
                isListening.value = false
                
                // 如果设置了自动重启且应该继续监听，则自动重启
                if (autoRestart && shouldListen.value) {
                    console.log('自动重启语音识别')
                    setTimeout(() => {
                        if (shouldListen.value && recognition.value) {
                            try {
                                recognition.value.start()
                                isListening.value = true
                            } catch (err) {
                                console.error('自动重启失败:', err)
                            }
                        }
                    }, 100)
                }
            }

            return true
        } catch (err) {
            console.error('初始化语音识别失败:', err)
            error.value = '初始化语音识别失败'
            return false
        }
    }

    // 开始监听
    const start = () => {
        if (!recognition.value) {
            if (!initRecognition()) {
                return false
            }
        }

        if (!recognition.value) {
            error.value = '语音识别未初始化'
            return false
        }

        if (isListening.value) {
            console.log('已经在监听中')
            return true
        }

        shouldListen.value = true

        try {
            recognition.value.start()
            isListening.value = true
            error.value = null
            console.log('开始语音识别监听')
            return true
        } catch (err: any) {
            console.error('启动语音识别失败:', err)
            // 如果已经在运行，先停止再启动
            if (err.message?.includes('already started')) {
                stop()
                setTimeout(() => {
                    start()
                }, 100)
            } else {
                error.value = '启动语音识别失败'
                isListening.value = false
                shouldListen.value = false
            }
            return false
        }
    }

    // 停止监听
    const stop = () => {
        shouldListen.value = false
        // 清除防抖定时器
        if (triggerTimeout !== null) {
            clearTimeout(triggerTimeout)
            triggerTimeout = null
        }
        lastTriggeredText = ''
        
        if (recognition.value && isListening.value) {
            try {
                recognition.value.stop()
                isListening.value = false
                console.log('停止语音识别监听')
            } catch (err) {
                console.error('停止语音识别失败:', err)
            }
        }
    }

    // 销毁
    const destroy = () => {
        stop()
        recognition.value = null
    }

    // 组件卸载时清理
    onUnmounted(() => {
        destroy()
    })

    // 初始化检查
    checkSupport()

    return {
        isSupported,
        isListening,
        error,
        currentTranscript,
        start,
        stop,
        destroy,
        initRecognition,
    }
}
