const axios = require('axios')
require('dotenv').config()

const env = process.env

function header() {

    const authorization = Buffer.from(`${env.PAYUNIT_API_USER}:${env.PAYUNIT_API_PASSWORD}`).toString('base64')    
    return {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
        "x-api-key": env.PAYUNIT_API_KEY,
        "mode": env.PAYUNIT_MODE
    }
}

async function check_transaction (gateway, transaction_id, data) {
    try {
        let params = ''

        if (gateway === 'mtnmomo') {

            params = {
                pay_token: data.pay_token,
                payment_ref: data.payment_ref
            }
        } else if (gateway === 'orange') {

            params = {
                paytoken: data.paytoken,
                "auth-token": data['auth-token'],
                "x-token": data['x-token']
            }
        } else {

            return false;
        }

        const response = await axios.get(`${env.PAYUNIT_BASE_URL}/gateway/paymentstatus/${gateway}/${transaction_id}`, {
            params: params,
            headers: header()
        })

        console.log(response)
        return response.data
    } catch (error) {

        throw error
    }
}

async function init_payment (total_amount, transaction_id, purchaseRef, app_name = '') {

    try {

        const response = await axios.post(`${env.PAYUNIT_BASE_URL}/gateway/initialize`, {
            "total_amount": total_amount,
            "currency": env.PAYUNIT_CURRENCY,
            "transaction_id": transaction_id,
            "return_url": `${env.APP_BASE_URL}/payunit/return`,
            "description": "Initialization for an eneo bill payment.",
            "purchaseRef": purchaseRef,
            "name": app_name
        }, {
            headers: header()
        })

        return response.data
    } catch (error) {

        throw error
    }
}

async function make_payment(transaction_url, transaction_id, transaction_sum) {

    try {

        const response = await axios.get(`${env.PAYUNIT_BASE_URL}/gateway/gateways`, {
            params: {
                "t_url": transaction_url,
                "t_id": transaction_id,
                "t_sum": transaction_sum,
            },
            headers: header()
        })

        return response.data
    } catch (error) {

        throw error
    }
}

async function pay_transaction(gateway, amount, transaction_id, phone, app_name) {

    const name = app_name || env.APP_NAME

    console.log({
        "gateway": gateway,
        "amount": amount,
        "transaction_id": transaction_id,
        "return_url": `${env.APP_BASE_URL}/payunit/return`,
        "phone_number": phone,
        "currency": env.PAYUNIT_CURRENCY,
        "name": app_name,
        "paymentType": "button"
    })

    try {
        const response = await axios.post(`${env.PAYUNIT_BASE_URL}/gateway/makepayment`, {
            "gateway": gateway,
            "amount": amount,
            "transaction_id": transaction_id,
            "return_url": `${env.APP_BASE_URL}/payunit/return`,
            "phone_number": phone,
            "currency": env.PAYUNIT_CURRENCY,
            "name": app_name,
            "paymentType": "button"
        }, {
            headers: header()
        })

        return response
    } catch (error) {
        throw error
    }
}

module.exports = { init_payment, make_payment, pay_transaction, check_transaction }
