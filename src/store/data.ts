import type { IPrizeConfig } from '@/types/storeType'
import { getDefaultPersonList } from '@/data/defaultPersonList'

const originUrl = 'https://to2026.xyz'
const currentTime = new Date().toString()
export const defaultPersonList = getDefaultPersonList(currentTime)

export const defaultMusicList = [
    {
        id: `Geoff Knorr - China (The Industrial Era).ogg${new Date().getTime().toString()}`,
        name: 'Geoff Knorr - China (The Industrial Era).ogg',
        url: `${originUrl}/resource/audio/Geoff Knorr - China (The Industrial Era).ogg`,
    },
    {
        id: `Geoff Knorr&Phill Boucher - China (The Atomic Era).ogg${new Date().getTime().toString()}`,
        name: 'Geoff Knorr&Phill Boucher - China (The Atomic Era).ogg',
        url: `${originUrl}/resource/audio/Geoff Knorr&Phill Boucher - China (The Atomic Era).ogg`,
    },
    {
        id: `Radetzky March.mp3${new Date().getTime().toString()}`,
        name: 'Radetzky March.mp3',
        url: `${originUrl}/resource/audio/Radetzky March.mp3`,
    },
    {
        id: `Shanghai.mp3${new Date().getTime().toString()}`,
        name: 'Shanghai.mp3',
        url: `${originUrl}/resource/audio/Shanghai.mp3`,
    },
    {
        id: `Waltz No.2.mp3${new Date().getTime().toString()}`,
        name: 'Waltz No.2.mp3',
        url: `${originUrl}/resource/audio/Waltz No.2.mp3`,
    },
    {
        id: `WildChinaTheme.mp3${new Date().getTime().toString()}`,
        name: 'WildChinaTheme.mp3',
        url: `${originUrl}/resource/audio/WildChinaTheme.mp3`,
    },
    {
        id: `边程&房东的猫 - 美好事物-再遇少年.ogg${new Date().getTime().toString()}`,
        name: '边程&房东的猫 - 美好事物-再遇少年.ogg',
        url: `${originUrl}/resource/audio/边程&房东的猫 - 美好事物-再遇少年.ogg`,
    },
    {
        id: `大乔小乔 - 相见难别亦难.ogg${new Date().getTime().toString()}`,
        name: '大乔小乔 - 相见难别亦难.ogg',
        url: `${originUrl}/resource/audio/大乔小乔 - 相见难别亦难.ogg`,
    },
    {
        id: `你要跳舞吗-新裤子.mp3${new Date().getTime().toString()}`,
        name: '你要跳舞吗-新裤子.mp3',
        url: `${originUrl}/resource/audio/你要跳舞吗-新裤子.mp3`,
    },
    {
        id: `生命-声音玩具.mp3${new Date().getTime().toString()}`,
        name: '生命-声音玩具.mp3',
        url: `${originUrl}/resource/audio/生命-声音玩具.mp3`,
    },
    {
        id: `与非门 - Happy New Year.ogg${new Date().getTime().toString()}`,
        name: '与非门 - Happy New Year.ogg',
        url: `${originUrl}/resource/audio/与非门 - Happy New Year.ogg`,
    },

]

export const defaultPrizeList = <IPrizeConfig[]>[
    {
        id: '001',
        name: 'Fifth Prize Round 1',
        sort: 1,
        isAll: false,
        count: 10,
        isUsedCount: 0,
        picture: {
            id: '1',
            name: 'Fifth Prize',
            url: '',
        },
        separateCount: {
            enable: true,
            countList: [],
        },
        desc: 'Fifth Prize',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '002',
        name: 'Fifth Prize Round 2',
        sort: 2,
        isAll: false,
        count: 10,
        isUsedCount: 0,
        picture: {
            id: '2',
            name: 'Fifth Prize',
            url: '',
        },
        separateCount: {
            enable: true,
            countList: [],
        },
        desc: 'Fifth Prize',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '003',
        name: 'Fourth Prize',
        sort: 3,
        isAll: false,
        count: 15,
        isUsedCount: 0,
        picture: {
            id: '3',
            name: 'Fourth Prize',
            url: '',
        },
        separateCount: {
            enable: false,
            countList: [],
        },
        desc: 'Fourth Prize',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '004',
        name: 'Third Prize',
        sort: 4,
        isAll: false,
        count: 10,
        isUsedCount: 0,
        picture: {
            id: '4',
            name: 'Third Prize',
            url: '',
        },
        separateCount: {
            enable: false,
            countList: [],
        },
        desc: 'Third Prize',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '005',
        name: 'Second Prize',
        sort: 5,
        isAll: false,
        count: 5,
        isUsedCount: 0,
        picture: {
            id: '5',
            name: 'Second Prize',
            url: '',
        },
        separateCount: {
            enable: false,
            countList: [],
        },
        desc: 'Second Prize',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '006',
        name: 'First Prize',
        sort: 6,
        isAll: false,
        count: 1,
        isUsedCount: 0,
        picture: {
            id: '6',
            name: 'First Prize',
            url: '',
        },
        separateCount: {
            enable: false,
            countList: [],
        },
        desc: 'First Prize',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '007',
        name: 'Lucky Prize Round 1',
        sort: 7,
        isAll: false,
        count: 25,
        isUsedCount: 0,
        picture: {
            id: '7',
            name: 'Lucky Prize',
            url: '',
        },
        separateCount: {
            enable: false,
            countList: [],
        },
        desc: 'Lucky Prize Round 1',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '008',
        name: 'Lucky Prize Round 2',
        sort: 8,
        isAll: false,
        count: 25,
        isUsedCount: 0,
        picture: {
            id: '8',
            name: 'Lucky Prize',
            url: '',
        },
        separateCount: {
            enable: false,
            countList: [],
        },
        desc: 'Lucky Prize Round 2',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
]
export const defaultCurrentPrize = <IPrizeConfig>{
    id: '001',
    name: '三等奖',
    sort: 1,
    isAll: false,
    count: 12,
    isUsedCount: 0,
    picture: {
        id: '2',
        name: '三等奖',
        url: `${originUrl}/resource/image/image3.png`,
    },
    separateCount: {
        enable: true,
        countList: [],
    },
    desc: '三等奖',
    isShow: true,
    isUsed: false,
    frequency: 1,
}
export const defaultTemporaryPrize = <IPrizeConfig>{
    id: '',
    name: '',
    sort: 0,
    isAll: false,
    count: 1,
    isUsedCount: 0,
    picture: {
        id: '-1',
        name: '',
        url: '',
    },
    separateCount: {
        enable: true,
        countList: [],
    },
    desc: '',
    isShow: false,
    isUsed: false,
    frequency: 1,
}

export const defaultImageList = [
    {
        id: '5',
        name: '默认图片',
        url: '/backimage.jpg', // 此路径会在组件中映射到 src/assets/images/backimage.jpg
    },
]
export const defaultPatternList = [21, 38, 55, 54, 53, 70, 87, 88, 89, 23, 40, 57, 74, 91, 92, 76, 59, 42, 25, 24, 27, 28, 29, 46, 63, 62, 61, 78, 95, 96, 97, 20, 19, 31, 48, 66, 67, 84, 101, 100, 32, 33, 93, 65, 82, 99]
