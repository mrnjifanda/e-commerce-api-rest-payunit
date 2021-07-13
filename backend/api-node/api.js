require('dotenv').config()
const express = require('express')
const multer = require('multer')
const app = express()

const port = process.env.APP_PORT || 3000
const upload = multer();

const payunit = require('./payunit/payunit')

function isNumeric(number) {
    return !isNaN(parseFloat(number)) && isFinite(number)
}

function gateway_method(phone) {
    const mtn_regex = new RegExp(/^([6]([7]))([0-9]{7})|^([6]([5]))([0-4]{1})([0-9]{6})/g)
    const orange_regex = new RegExp(/^([6]([9]))([0-9]{7})|^([6]([5]))([5-9]{1})([0-9]{6})/g)
    let valide_phone = phone
    const valide_phone_length = valide_phone.length

    if (valide_phone_length >= 9) {
        const end = valide_phone_length
        const start = valide_phone_length - 9
        valide_phone = valide_phone.slice(start, end)

        if (mtn_regex.test(valide_phone)) return { phone: valide_phone, method: "mtnmomo" } 

        if (orange_regex.test(valide_phone)) return { phone: valide_phone, method: "orange" }
    }

    throw { error: true, message: "Incorrect phone number, please retry" }
}

function verify_body(body) {

    const response = { error: true }

    const size = ['S', 'M', 'L', 'XL']

    if (!body['product-title']) response['product-title'] = 'The name of the article is unavailable'

    // if (body['product-price'] != 25 && body['product-price'] != 50) response['product-price']= 'Incorrect item price'

    if (!body['product-size'] || size.indexOf(body['product-size']) == -1) response['product-size']= 'Item size not found'

    if (!body['product-quanity'] || !isNumeric(body['product-quanity'])) response['product-quanity']= 'The quantity must be a number'

    if (!body['product-address']) response['product-address'] = 'Invalid delivery address'
    
    if (Object.keys(response).length > 1) throw response

    return {
        id: `jg-${Date.now()}`,
        title: body['product-title'],
        price: body['product-price'],
        size: body['product-size'],
        quanity: body['product-quanity'],
        address: body['product-address'],
        amount: parseInt(body['product-price']) * parseInt(body['product-quanity']),
    }
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(upload.array()); 
app.use(express.static('public'));

app.get('/', async (req, res) => {
    res.send('API Start')
})

app.post('/init-transaction', async (req, res) => {

    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")

    try {

        const transaction = verify_body(req.body)
        console.log(transaction)

        const init_payunit_payment = await payunit.init_payment(transaction.amount, transaction.id, `Item name: ${transaction.title}`)
        console.log(init_payunit_payment)

        const make_payunit_payment = await payunit.make_payment(init_payunit_payment.data.t_url, init_payunit_payment.data.t_id, init_payunit_payment.data.t_sum)
        make_payunit_payment.transaction = transaction
        console.log(make_payunit_payment)


        res.status(200).send(make_payunit_payment);
        // res.status(200).send(response)

        // /* If PayUnit Sandbox */
        // if (configs.payunit.mode === "test") {

        //     setTimeout(async () => {
        //         await api.valide_sandbox_transaction(transaction.id)
        //     }, 10000);
        // }

    } catch (error) {

        // const phone = error.send
        // if (phone !== false) await sms.send("error", phone, error.data.message)
 
        console.log(error)
        res.status(500).send(error)
    }
})

app.post('/checkout', async (req, res) => {

    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")

    try {

        const body = req.body
        const transaction = JSON.parse(body.transaction)
        const name = transaction.gateway === "eu" ? body.name : ''
        
        const pay_payunit_payment = await payunit.pay_transaction(transaction.gateway, transaction.amount, transaction.id, body.phone, name)
        console.log(pay_payunit_payment.data)

        res.status(200).send(pay_payunit_payment.data)

    } catch (error) {

        console.log(error)
        res.status(500).send(error)
    }
})

app.post('/check-transation', async (req, res) => {

    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")

    try {

        const transaction = req.body
        const status = await payunit.check_transaction(transaction.gateway, transaction.transaction_id, transaction)
        console.log(status)

        res.status(200).send(status)
    } catch (error) {

        console.log(error)
        res.status(500).send(error)
    }
})

app.listen(port, () => {

    console.log(`Server: http://localhost:${port}`)
})
