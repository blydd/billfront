// API 基础地址
export const BASE_URL = 'https://yqccrdqeszui.sealosbja.site'

// API 接口地址
export const API = {
  // 账单相关接口
  BILLS: {
    QUERY: `${BASE_URL}/api/bills/query`,
    CREATE: `${BASE_URL}/api/bills/save`,
    UPDATE: (id) => `${BASE_URL}/api/bills/update/${id}`,
    DELETE: (id) => `${BASE_URL}/api/bills/delete/${id}`,
    DETAIL: (id) => `${BASE_URL}/api/bills/${id}`,
  },
  // 标签相关接口
  TAGS: {
    LIST: `${BASE_URL}/api/tags/query`,
    CREATE: `${BASE_URL}/api/tags/save`,
    UPDATE: (id) => `${BASE_URL}/api/tags/update/${id}`,
    QUERY:(id) => `${BASE_URL}/api/tags/${id}`,
    DELETE: (id) => `${BASE_URL}/api/tags/delete/${id}`,
  }
} 