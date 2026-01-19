<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toast-notification'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import useStore from '@/store'
import HeaderTitle from './components/HeaderTitle/index.vue'
import OptionButton from './components/OptionsButton/index.vue'
import PrizeList from './components/PrizeList/index.vue'
import StarsBackground from './components/StarsBackground/index.vue'
import { LotteryStatus } from './type'
import { useViewModel } from './useViewModel'
import 'vue-toast-notification/dist/theme-sugar.css'

const viewModel = useViewModel()
const { setDefaultPersonList, tableData, currentStatus, enterLottery, stopLottery, containerRef, startLottery, continueLottery, quitLottery, isInitialDone, titleFont, titleFontSyncGlobal } = viewModel
const globalConfig = useStore().globalConfig
const toast = useToast()

const { getTopTitle: topTitle, getTextColor: textColor, getTextSize: textSize, getBackground: homeBackground } = storeToRefs(globalConfig)

// 实时识别文字显示
const displayTranscript = ref<string>('')

// 更新显示文字的通用函数
function updateTranscript(text: string) {
    displayTranscript.value = text
}

// 语音识别：监听"开始抽奖"
function handleStartCommand(_text: string) {
    // 在准备状态，识别到"开始抽奖"时，触发开始抽奖
    if (currentStatus.value === LotteryStatus.ready) {
        toast.success('识别到"开始抽奖"，开始抽奖！', { duration: 2000 })
        startLottery()
    }
}

const speechRecognitionStart = useSpeechRecognition(handleStartCommand, ['开始抽奖', '开始', '抽奖'], true, updateTranscript)

// 语音识别：监听"喊停"
function handleStopCommand(_text: string) {
    if (currentStatus.value === LotteryStatus.running) {
        toast.success('识别到"喊停"，停止抽奖！', { duration: 2000 })
        stopLottery()
    }
}

const speechRecognitionStop = useSpeechRecognition(handleStopCommand, ['喊停', '停止', '停', '好运连连'], true, updateTranscript)

// 语音识别：监听"继续"
function handleContinueCommand(_text: string) {
    if (currentStatus.value === LotteryStatus.end) {
        toast.success('识别到"继续"，继续抽奖！', { duration: 2000 })
        continueLottery()
    }
}

const speechRecognitionContinue = useSpeechRecognition(handleContinueCommand, ['继续', '继续抽奖', '再来一次'], true, updateTranscript)

// 检查是否支持并已初始化语音识别
const isSpeechAvailable = computed(() => {
    return speechRecognitionStart.isSupported.value || 
           speechRecognitionStop.isSupported.value || 
           speechRecognitionContinue.isSupported.value
})

// 监听状态变化，控制语音识别
watch(currentStatus, (newStatus) => {
    // 停止所有语音识别
    speechRecognitionStart.stop()
    speechRecognitionStop.stop()
    speechRecognitionContinue.stop()

    // 根据状态启动相应的语音识别
    // 注意：初始状态（init）不启用语音识别，需要手动点击"进入抽奖"按钮
    if (newStatus === LotteryStatus.ready) {
        // 开始按钮出现，监听"开始抽奖"
        setTimeout(() => {
            if (speechRecognitionStart.isSupported.value) {
                const started = speechRecognitionStart.start()
                if (!started) {
                    console.warn('启动语音识别失败:', speechRecognitionStart.error.value)
                    if (speechRecognitionStart.error.value) {
                        toast.warning(speechRecognitionStart.error.value, { duration: 3000 })
                    }
                }
            }
            else {
                console.warn('浏览器不支持语音识别')
            }
        }, 300)
    }
    else if (newStatus === LotteryStatus.running) {
        // 抽奖进行中，监听"喊停"
        setTimeout(() => {
            if (speechRecognitionStop.isSupported.value) {
                const started = speechRecognitionStop.start()
                if (!started) {
                    console.warn('启动语音识别失败:', speechRecognitionStop.error.value)
                    if (speechRecognitionStop.error.value) {
                        toast.warning(speechRecognitionStop.error.value, { duration: 3000 })
                    }
                }
            }
            else {
                console.warn('浏览器不支持语音识别')
            }
        }, 300)
    }
    else if (newStatus === LotteryStatus.end) {
        // 抽奖结束，显示"继续"按钮，监听"继续"
        setTimeout(() => {
            if (speechRecognitionContinue.isSupported.value) {
                const started = speechRecognitionContinue.start()
                if (!started) {
                    console.warn('启动语音识别失败:', speechRecognitionContinue.error.value)
                    if (speechRecognitionContinue.error.value) {
                        toast.warning(speechRecognitionContinue.error.value, { duration: 3000 })
                    }
                }
            }
            else {
                console.warn('浏览器不支持语音识别')
            }
        }, 300)
    }
}, { immediate: true })
</script>

<template>
  <HeaderTitle
    :table-data="tableData"
    :text-size="textSize"
    :text-color="textColor"
    :top-title="topTitle"
    :set-default-person-list="setDefaultPersonList"
    :is-initial-done="isInitialDone"
    :title-font="titleFont"
    :title-font-sync-global="titleFontSyncGlobal"
    style="z-index: 2;"
  />
  <StarsBackground :home-background="homeBackground" />
  <div id="container" ref="containerRef" class="3dContainer">
    <OptionButton
      :current-status="currentStatus"
      :table-data="tableData"
      :enter-lottery="enterLottery"
      :start-lottery="startLottery"
      :stop-lottery="stopLottery"
      :continue-lottery="continueLottery"
      :quit-lottery="quitLottery"
      style="z-index: 3;"
    />
    <!-- 语音识别状态显示 -->
    <div v-if="isSpeechAvailable" class="speech-indicator">
      <svg
        v-if="displayTranscript || speechRecognitionStart.isListening.value || speechRecognitionStop.isListening.value || speechRecognitionContinue.isListening.value"
        class="mic-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      <span v-if="displayTranscript" class="transcript-text">{{ displayTranscript }}</span>
    </div>
  </div>

  <PrizeList class="absolute left-0 top-0" style="z-index: 3;" />
</template>

<style scoped lang="scss">
.speech-indicator {
  position: absolute;
  bottom: 10px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 4;
  opacity: 0.65;
  transition: opacity 0.3s ease;
  pointer-events: none;
  font-size: 13px;

  &:hover {
    opacity: 0.8;
  }

  .mic-icon {
    width: 18px;
    height: 18px;
    color: currentColor;
    flex-shrink: 0;
    opacity: 0.85;
  }

  .transcript-text {
    font-size: 13px;
    color: currentColor;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.85;
  }
}
</style>
