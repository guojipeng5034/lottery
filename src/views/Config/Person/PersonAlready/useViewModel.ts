import type { IPersonConfig } from '@/types/storeType'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import i18n from '@/locales/i18n'
import useStore from '@/store'
import { tableColumns } from './columns'

export function useViewModel() {
    const personConfig = useStore().personConfig

    const { getAlreadyPersonList: alreadyPersonList, getAlreadyPersonDetail: alreadyPersonDetail } = storeToRefs(personConfig)

    const isDetail = ref(false)
    function handleMoveNotPerson(row: IPersonConfig) {
        personConfig.moveAlreadyToNot(row)
    }

    // 导出数据
    function exportData() {
        // 根据 isDetail 决定导出哪个数据源
        const dataSource = isDetail.value ? alreadyPersonDetail.value : alreadyPersonList.value
        let data = JSON.parse(JSON.stringify(dataSource))

        // 排除一些字段
        for (let i = 0; i < data.length; i++) {
            delete data[i].x
            delete data[i].y
            delete data[i].id
            delete data[i].createTime
            delete data[i].updateTime
            delete data[i].prizeId
            delete data[i].avatar
            delete data[i].dateTime
            delete data[i].type
            delete data[i].uid
            // 修改字段名称
            if (data[i].isWin) {
                data[i].isWin = i18n.global.t('data.yes')
            }
            else {
                data[i].isWin = i18n.global.t('data.no')
            }
            // 格式化数组为字符串
            if (Array.isArray(data[i].prizeTime)) {
                data[i].prizeTime = data[i].prizeTime.join(',')
            }
            if (Array.isArray(data[i].prizeName)) {
                data[i].prizeName = data[i].prizeName.join(',')
            }
        }
        let dataString = JSON.stringify(data)
        dataString = dataString
            .replaceAll(/isWin/g, i18n.global.t('data.isWin'))
            .replaceAll(/department/g, i18n.global.t('data.department'))
            .replaceAll(/name/g, i18n.global.t('data.name'))
            .replaceAll(/identity/g, i18n.global.t('data.identity'))
            .replaceAll(/prizeName/g, i18n.global.t('data.prizeName'))
            .replaceAll(/prizeTime/g, i18n.global.t('data.prizeTime'))

        data = JSON.parse(dataString)

        if (data.length > 0) {
            const dataBinary = XLSX.utils.json_to_sheet(data)
            const dataBinaryBinary = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(dataBinaryBinary, dataBinary, 'Sheet1')
            const fileName = i18n.global.locale.value === 'zhCn' ? '已中奖人员.xlsx' : 'winner-list.xlsx'
            XLSX.writeFile(dataBinaryBinary, fileName)
        }
    }

    const tableColumnsList = tableColumns({ showPrizeTime: false, handleDeletePerson: handleMoveNotPerson })
    const tableColumnsDetail = tableColumns({ showPrizeTime: true, handleDeletePerson: handleMoveNotPerson })
    return {
        alreadyPersonList,
        alreadyPersonDetail,
        isDetail,
        tableColumnsList,
        tableColumnsDetail,
        exportData,
    }
}
