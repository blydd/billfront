// API 基础地址
export const BASE_URL = 'http://localhost:8080'

// API 接口地址
export const API = {
  // 账单相关接口
  BILLS: {
    QUERY: `${BASE_URL}/api/bills/query`,
    CREATE: `${BASE_URL}/api/bills`,
    UPDATE: (id) => `${BASE_URL}/api/bills/${id}`,
    DELETE: (id) => `${BASE_URL}/api/bills/${id}`,
    DETAIL: (id) => `${BASE_URL}/api/bills/${id}`,
  },
  // 标签相关接口
  TAGS: {
    LIST: `${BASE_URL}/api/tags`,
  }
} 