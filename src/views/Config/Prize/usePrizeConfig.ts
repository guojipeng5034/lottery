import type { IPrizeConfig } from '@/types/storeType'
import localforage from 'localforage'
import { cloneDeep } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toast-notification'
import i18n from '@/locales/i18n'
import useStore from '@/store'

export function usePrizeConfig() {
    const toast = useToast()
    const imageDbStore = localforage.createInstance({
        name: 'imgStore',
    })
    const prizeConfig = useStore().prizeConfig
    const globalConfig = useStore().globalConfig
    const personConfig = useStore().personConfig
    const { getPrizeConfig: localPrizeList, getCurrentPrize: currentPrize } = storeToRefs(prizeConfig)

    const { getImageList: localImageList } = storeToRefs(globalConfig)
    const { getAlreadyPersonList: alreadyPersonList } = storeToRefs(personConfig)
    const imgList = ref<any[]>([])

    const prizeList = ref(cloneDeep(localPrizeList.value))
    const selectedPrize = ref<IPrizeConfig | null>()
    const deleteDialogVisible = ref(false)
    const prizeToDelete = ref<IPrizeConfig | null>(null)

    function selectPrize(item: IPrizeConfig) {
        selectedPrize.value = item
        selectedPrize.value.isUsedCount = 0
        selectedPrize.value.isUsed = false

        if (selectedPrize.value.separateCount.countList.length > 1) {
            return
        }
        selectedPrize.value.separateCount = {
            enable: true,
            countList: [
                {
                    id: '0',
                    count: item.count,
                    isUsedCount: 0,
                },
            ],
        }
    }

    function changePrizeStatus(item: IPrizeConfig) {
        item.isUsed ? item.isUsedCount = 0 : item.isUsedCount = item.count
        item.separateCount.countList = []
        item.isUsed = !item.isUsed
    }

    function changePrizePerson(item: IPrizeConfig) {
        let indexPrize = -1
        for (let i = 0; i < prizeList.value.length; i++) {
            if (prizeList.value[i].id === item.id) {
                indexPrize = i
                break
            }
        }
        if (indexPrize > -1) {
            prizeList.value[indexPrize].separateCount.countList = []
            prizeList.value[indexPrize].isUsed ? prizeList.value[indexPrize].isUsedCount = prizeList.value[indexPrize].count : prizeList.value[indexPrize].isUsedCount = 0
        }
    }
    function submitData(value: any) {
        selectedPrize.value!.separateCount.countList = value
        selectedPrize.value = null
    }

    async function getImageDbStore() {
        const keys = await imageDbStore.keys()
        if (keys.length > 0) {
            imageDbStore.iterate((value, key) => {
                imgList.value.push({
                    key,
                    value,
                })
            })
        }
    }

    // 检查是否有已中奖的人员
    function hasWinnersForPrize(prizeId: string | number): boolean {
        const prizeIdStr = String(prizeId)
        return alreadyPersonList.value.some((person) => {
            return Array.isArray(person.prizeId) && person.prizeId.includes(prizeIdStr)
        })
    }

    function delItem(item: IPrizeConfig, event?: Event) {
        // 确保只有点击删除按钮本身才触发删除
        if (event) {
            const target = event.target as HTMLElement
            // 检查点击目标是否是按钮本身或其子元素（如按钮内的文本）
            const button = target.closest('button.btn-error')
            if (!button) {
                return
            }
            // 阻止事件继续传播
            event.stopPropagation()
        }
        prizeToDelete.value = item
        deleteDialogVisible.value = true
    }

    function confirmDelete() {
        if (!prizeToDelete.value) {
            return
        }
        prizeConfig.deletePrizeConfig(prizeToDelete.value.id)
        toast.success(i18n.global.t('error.deleteSuccess'))
        deleteDialogVisible.value = false
        prizeToDelete.value = null
    }

    function cancelDelete() {
        deleteDialogVisible.value = false
        prizeToDelete.value = null
    }
    function addPrize() {
        const defaultPrizeCOnfig: IPrizeConfig = {
            id: new Date().getTime().toString(),
            name: i18n.global.t('data.prizeName'),
            sort: 0,
            isAll: false,
            count: 1,
            isUsedCount: 0,
            picture: {
                id: '',
                name: '',
                url: '',
            },
            separateCount: {
                enable: false,
                countList: [],
            },
            desc: '',
            isUsed: false,
            isShow: true,
            frequency: 1,
        }
        prizeList.value.push(defaultPrizeCOnfig)
        toast.success(i18n.global.t('error.success'))
    }
    function resetDefault() {
        prizeConfig.resetDefault()
        prizeList.value = cloneDeep(localPrizeList.value)
        toast.success(i18n.global.t('error.success'))
    }
    async function delAll() {
        prizeList.value = []
        toast.success(i18n.global.t('error.success'))
    }
    onMounted(() => {
        getImageDbStore()
    })
    watch(() => prizeList.value, (val: IPrizeConfig[]) => {
        prizeConfig.setPrizeConfig(val)
    }, { deep: true })

    return {
        addPrize,
        resetDefault,
        delAll,
        delItem,
        prizeList,
        currentPrize,
        selectedPrize,
        submitData,
        changePrizePerson,
        changePrizeStatus,
        selectPrize,
        localImageList,
        deleteDialogVisible,
        prizeToDelete,
        confirmDelete,
        cancelDelete,
        hasWinnersForPrize,
    }
}
