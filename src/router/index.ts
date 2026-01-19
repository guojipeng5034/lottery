import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'
import i18n from '@/locales/i18n'
import Home from '@/views/Home/index.vue'

export const configRoutes = {
    path: '/lottery-draw/config',
    name: 'Config',
    component: () => import('@/views/Config/index.vue'),
    children: [
        {
            path: '',
            redirect: '/lottery-draw/config/person',
        },
        {
            path: '/lottery-draw/config/person',
            name: 'PersonConfig',
            component: () => import('@/views/Config/Person/index.vue'),
            meta: {
                title: i18n.global.t('sidebar.personConfiguration'),
                icon: 'person',
            },
            children: [
                {
                    path: '',
                    redirect: '/lottery-draw/config/person/all',
                },
                {
                    path: '/lottery-draw/config/person/all',
                    name: 'AllPersonConfig',
                    component: () => import('@/views/Config/Person/PersonAll/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.personList'),
                        icon: 'all',
                    },
                },
                {
                    path: '/lottery-draw/config/person/already',
                    name: 'AlreadyPerson',
                    component: () => import('@/views/Config/Person/PersonAlready/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.winnerList'),
                        icon: 'already',
                    },
                },
                // {
                //     path:'other',
                //     name:'OtherPersonConfig',
                //     component:()=>import('@/views/Config/Person/OtherPersonConfig.vue'),
                //     meta:{
                //         title:'其他配置',
                //         icon:'other'
                //     }
                // }
            ],
        },
        {
            path: '/lottery-draw/config/prize',
            name: 'PrizeConfig',
            component: () => import('@/views/Config/Prize/PrizeConfig.vue'),
            meta: {
                title: i18n.global.t('sidebar.prizeConfiguration'),
                icon: 'prize',
            },
        },
        {
            path: '/lottery-draw/config/global',
            name: 'GlobalConfig',
            redirect: '/lottery-draw/config/global/all',
            meta: {
                title: i18n.global.t('sidebar.globalSetting'),
                icon: 'global',
            },
            children: [
                {
                    path: '/lottery-draw/config/global/face',
                    name: 'FaceConfig',
                    component: () => import('@/views/Config/Global/FaceConfig/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.viewSetting'),
                        icon: 'face',
                    },
                },
                {
                    path: '/lottery-draw/config/global/image',
                    name: 'ImageConfig',
                    component: () => import('@/views/Config/Global/ImageConfig/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.imagesManagement'),
                        icon: 'image',
                    },
                },
                {
                    path: '/lottery-draw/config/global/music',
                    name: 'MusicConfig',
                    component: () => import('@/views/Config/Global/MusicConfig/index.vue'),
                    meta: {
                        title: i18n.global.t('sidebar.musicManagement'),
                        icon: 'music',
                    },
                },
            ],
        },
        {
            path: '/lottery-draw/config/readme',
            name: 'Readme',
            component: () => import('@/views/Config/Readme/index.vue'),
            meta: {
                title: i18n.global.t('sidebar.operatingInstructions'),
                icon: 'readme',
            },
        },
    ],
}
const routes = [
    {
        path: '/',
        redirect: '/lottery-draw',
    },
    {
        path: '/lottery-draw',
        component: Layout,
        redirect: '/lottery-draw/home',
        children: [
            {
                path: '/lottery-draw/home',
                name: 'Home',
                component: Home,
            },
            {
                path: '/lottery-draw/demo',
                name: 'Demo',
                component: () => import('@/views/Demo/index.vue'),
            },
            configRoutes,
        ],
    },
]
const envMode = import.meta.env.MODE
const router = createRouter({
    // 读取环境变量
    history: (envMode === 'file' || import.meta.env.TAURI_PLATFORM) ? createWebHashHistory() : createWebHistory(),
    routes,
})

export default router
