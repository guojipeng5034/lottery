<script setup lang='ts'>
import { useElementSize } from '@vueuse/core'
import localforage from 'localforage'
import Sparticles from 'sparticles'
import { onMounted, onUnmounted, ref } from 'vue'
import backimageUrl from '@/assets/images/backimage.jpg'

const props = defineProps({
    homeBackground: {
        type: Object,
        default: () => ({
            id: '',
            name: '',
            url: '',
        }),
    },
})
const imageDbStore = localforage.createInstance({
    name: 'imgStore',
})
const imgUrl = ref('')
const starRef = ref()

const { width, height } = useElementSize(starRef)
const options = ref({ shape: 'star', parallax: 1.2, rotate: true, twinkle: true, speed: 10, count: 200 })
function addSparticles(node: any, width: number, height: number) {
    const sparticleInstance = new Sparticles(node, options.value, width, height)
    return sparticleInstance
}
// 页面大小改变时
function listenWindowSize() {
    window.addEventListener('resize', () => {
        if (width.value && height.value) {
            addSparticles(starRef.value, width.value, height.value)
        }
    })
}

async function getImageStoreItem(item: any): Promise<string> {
    let image = ''
    if (item.url === 'Storage') {
        const key = item.id
        const imageData = await imageDbStore.getItem(key) as any
        image = URL.createObjectURL(imageData.data)
    }
    // 检查是否是 backimage.jpg，如果是，使用导入的图片路径
    else if (item.url === '/backimage.jpg' || item.url.includes('backimage.jpg')) {
        image = backimageUrl
    }
    else {
        image = item.url
    }

    return image
}
onMounted(() => {
    getImageStoreItem(props.homeBackground).then((image) => {
        imgUrl.value = image
    })
    addSparticles(starRef.value, width.value, height.value)
    listenWindowSize()
})
onUnmounted(() => {
    window.removeEventListener('resize', listenWindowSize)
})
</script>

<template>
    <div v-if="homeBackground.url" class="home-background w-full h-full overflow-hidden">
        <div class="bg-mask">
            <img :src="imgUrl" class="w-full h-full object-cover" alt="">
        </div>
    </div>
    <div v-else ref="starRef" class="w-full h-full overflow-hidden" />
</template>

<style scoped>
.bg-mask {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.bg-mask::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #0000002e;
    pointer-events: none;
    z-index: 1;
}
</style>