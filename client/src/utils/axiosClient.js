import axios from 'axios'
const axiosClient = axios.create({
          baseURL:'http://localhost:3000',
          withCredentials:true, // browser cookies ko add kr dena 
          headers:{
                    'Content-Type': 'application/json' // jo bhi bhej rha hun vo json type ka hoga
          }
})
export default axiosClient;