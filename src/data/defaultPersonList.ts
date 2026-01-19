import type { IPersonConfig } from '@/types/storeType'

type IPersonConfigWithoutUuid = Omit<IPersonConfig, 'uuid'>

/**
 * 获取默认人员列表数据
 * @param currentTime 当前时间字符串
 * @returns 默认人员列表
 */
export function getDefaultPersonList(currentTime: string): IPersonConfigWithoutUuid[] {
    return []
}
