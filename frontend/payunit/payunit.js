let transaction = null
let transactionTimer = 0

function addAppFormLoader(element) {
    const elements = element.querySelectorAll('input, textarea, button, select, a');
    const button = element.querySelector('button[type="submit"]');

    elements.forEach(elem => elem.setAttribute('disabled', 'true'));

    const span = document.createElement('span');
    span.setAttribute('style', 'display: inline-block; margin-right: 5px')
    span.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
    button.prepend(span);
}

function removeAppFormLoader(element) {
    const elements = element.querySelectorAll('input, textarea, button, select, a');
    const button = element.querySelector('button[type="submit"]');

    elements.forEach(elem => elem.removeAttribute('disabled'));
    remove(button.querySelector("span"));
}

function remove(element) {
    element.parentNode.removeChild(element);
}

$('.container-modal').on('click', '.button', function () {

    if(transaction === null) {
        alert("No pending transaction")
        return;
    }

    var $btn = $(this),
        $step = $btn.parents('.modal-body'),
        stepIndex = $step.index(),
        $pag = $('.modal-header span').eq(stepIndex);


    if($btn.text() === 'Done!') {
        step3($step, $pag)
    }

    if (stepIndex === 0) {
        if (!$('.container-modal .modal-body-step-1 .button').hasClass("disabled")) {
            
            step_two(transaction)
            step1($step, $pag);
        } else {
            alert("Select a payment method")
        }
        return
    }

    // if (stepIndex === 0 || stepIndex === 1) {
    //     step1($step, $pag);
    // } else {
    //     step3($step, $pag);
    // }
});

$('.container-modal').on('click', '.payuni-card-item', function () {
    var $card = $(this)

    if(transaction === null) {
        alert("No pending transaction")
        return;
    }

    if($card.hasClass("disabled") ) {
        alert("Payment method not available at the moment")
    } else {
        $('.container-modal .payuni-card-item').removeClass("border border-success")
        $card.addClass("border border-success")
        transaction.gateway = $card.attr("data-gateway")
        transaction.logo = $card.find('img')[0].src
        $('.container-modal .modal-body-step-1 .button').removeClass("disabled")
    }
});


function step1($step, $pag) {
    // animate the step out
    $step.addClass('animate-out');

    // animate the step in
    setTimeout(function () {
        $step.removeClass('animate-out is-showing')
            .next().addClass('animate-in');
        $pag.removeClass('is-active')
            .next().addClass('is-active');
    }, 600);

    // after the animation, adjust the classes
    setTimeout(function () {
        $step.next().removeClass('animate-in')
            .addClass('is-showing');
    }, 1200);
}


function step3($step, $pag) {
    // animate the step out
    $step.parents('.modal-wrap').addClass('animate-up');

    setTimeout(function () {
        $('.container-modal').fadeOut()
        transaction = null
        transactionTimer = 0
    }, 300);
}

$('.container-modal').on('click', '.rerun-button', function () {
    $('.modal-wrap').removeClass('animate-up')
        .find('.modal-body')
        .first().addClass('is-showing')
        .siblings().removeClass('is-showing');

    $('.modal-header span').first().addClass('is-active')
        .siblings().removeClass('is-active');
    $(this).hide();
});


/***/

function step_one(data) {
    const modal = document.querySelector(".container-modal")
    const step1 = modal.querySelector(".modal-body-step-1")

    step1.querySelector(".title").innerText = "Method of payment"
    step1.querySelector(".description").innerText = "Please kindly choose the payment method you want to use."

    let content = '<div>\
        <ul class="row payuni-card">'

    data.forEach(item => {
        content += htmlCard(item.provider_logo, item.provider_short_tag, item.provider_name)
    })

    content += `</ul></div>
        <div class="text-center mb-4">
            <div class="button disabled">Next Step</div>
        </div>`

    step1.querySelector(".step-content").innerHTML = content
}

function step_two(transaction) {
    const modal = document.querySelector(".container-modal")
    const step2 = modal.querySelector(".modal-body-step-2")
    const name = transaction.gateway === "eu" ? `<input type="text" placeholder="Enter your name" name="name" required />` : ''

    $('.modal-loader').hide()
    step2.querySelector(".step-content").innerHTML = `<form action="http://localhost:6200/checkout" method="POST" id="pay-checkout">
        <div class="card-body pb-0 text-center">
            <img src="${transaction.logo}" alt="${transaction.gateway}" style="height: 100px;">
            <h4 class="mt-3">Total: <strong class="text-success" style="font-size: 40px;">${transaction.amount}</strong> ${(transaction.currency || "XAF")}<h4>
        </div>
        <div style="margin-top: 20px; padding: 0 30px">
            <input type="hidden" name="transaction" value='${JSON.stringify(transaction)}' />
            ${name}
            <input type="number" placeholder="Enter the phone number" name="phone" required />
        </div>
        <div class="text-center mb-4" style="display: flex; justify-content: space-between; padding: 0 30px">
            <button type="button" class="rerun-button mr-1"><i class="fas fa-chevron-left"></i></button>
            <button type="submit" class="pay-button">Pay now</button>
        </div>
    </form>`
}

function check_status_transaction(submitForm, status) {

    if (submitForm.gateway !== 'orange' && submitForm.gateway !== 'mtnmomo') {
        return false
    }

    let form_data = new FormData();

    for ( var key in submitForm ) {
        form_data.append(key, submitForm[key]);
    }

    $.ajax({
        type: `POST`,
        url: `http://localhost:6200/check-transation`,
        data: form_data,
        processData: false,
        contentType: false,
        cache: false
    })
    .done(function(data, text, jqxhr) {
    
        if (data.status === 'SUCCESSFUL' || data.status === 'SUCCESSFULL') {

            finaly_step_status(data.status, data.message, status)
        } else if (data.status === 'FAILED' || transactionTimer === 200) {

            finaly_step_status('FAILED', 'You did not confirm the transaction on your phone. Please try again !!!', status)
        }


    })
    .fail(function(jqxhr) {

        console.log(jqxhr)
    })
}

function htmlCard(logo, short, name) {
    const disabled = (short === "paypal" || short === "stripe" ? true : false)
    const button = (disabled ? `<label${(disabled ? ' style="cursor: not-allowed;"' : "")}>${name}</label>` : `<label for="${logo}">${name}</label> <input type="hidden"  id="${logo}" value="${logo}">`)
    return `<li class="col-4">
        <div class="card payuni-card-item${(disabled ? ' disabled' : '')}" data-gateway="${short}">
            <div class="card-body pb-0 text-center">
                <img src="${logo}" alt="${name}">
                <div>${button}<div>
            </div>
        </div>
    </li>`
}

function finaly_step_status(status, message, timer) {
    const modal = document.querySelector(".container-modal")
    const step3 = modal.querySelector(".modal-body-step-3")
    const title = step3.querySelector('.title')

    let icon = ''
    let statusIcon = ''

    if (status === "SUCCESSFUL" || status === "SUCCESSFULL") {
        icon = 'check'
        statusIcon = 'success'
        title.classList = 'title'
    } else if(status === "PENDING") {
        icon = 'exclamation'
        statusIcon = 'warning'

        title.classList = 'title'
        title.classList.add('text-warning')
    } else {
        icon = 'times'
        statusIcon = 'error'

        title.classList = 'title'
        title.classList.add('text-danger')
    }

    title.innerText = status
    step3.querySelector('.description').innerHTML = `<div class="d-flex justify-content-center mt-5 mb-4">
        <div class="circle-wrapper">
            <div class="${statusIcon} circle"></div>
            <div class="icon">
                <i class="fa fa-${icon}"></i>
            </div>
        </div>
    </div>

    <p class="mt-3">${message}</p>

    <div class="text-center mb-4 mt-5">
        <div class="button">Done!</div>
    </div>`

    clearInterval(timer)
    const $step = $('.modal-body.modal-body-step-2.is-showing')
    const stepIndex = $step.index()
    const $pag = $('.modal-header span').eq(stepIndex);
    step1($step, $pag)
}

const payForm = document.getElementById('pay-form')
payForm.addEventListener('submit', async function (e) {

    e.preventDefault()

    const formData = new FormData(payForm)

    const form = this
    addAppFormLoader(form)

    $.ajax({
        type: form.method,
        url: form.action,
        data: formData,
        processData: false,
        contentType: false,
        cache: false,
    })
    .done(function(data, text, jqxhr) {

        if (data.status === "SUCCESS" && data.message === 'ok') {

            transaction = data.transaction
            step_one(data.data)

            document.querySelector('.container-modal .modal-wrap').classList.remove('animate-up')

            $('.modal-body').removeClass('is-showing')
            $('.modal-body.modal-body-step-1').addClass('is-showing')
            document.querySelector('.container-modal .modal-wrap').classList.remove('animate-up')
            $(".container-modal").fadeIn()
        } else {

            alert(text)
            console.log(data)
            console.log(text)
            console.log(jqxhr)
        }
    })
    .fail(function(jqxhr) {
        console.log(jqxhr)
    })
    .always(function() {
        removeAppFormLoader(form);
    });
})

$('.container-modal').on('submit', '#pay-checkout', function (e) {
    e.preventDefault()

    const form = this
    const data = new FormData(form)

    addAppFormLoader(form)

    $.ajax({
        type: form.method,
        url: form.action,
        data: data,
        processData: false,
        contentType: false,
        cache: false,
    })
    .done(function(data, text, jqxhr) {

        if ((data.status === "SUCCESS" || data.status === "PENDING") || data.statusCode ===  200) {

            $('.container-modal .modal-loader .modal-loader-content p').text(data.message)
            $('.container-modal .modal-loader').fadeIn()

            addAppFormLoader(form)
            const status = setInterval(async () => {

                const bodyForm = data.data
                bodyForm.gateway = transaction.gateway
                bodyForm.transaction_id = transaction.id
                transactionTimer += 10
                check_status_transaction(bodyForm, status)
            }, 10000);
            
        } else {

            alert(text)
            console.log(data)
            console.log(text)
            console.log(jqxhr)
        }
    })
    .fail(function(jqxhr) {
        console.log(jqxhr)
    })
    .always(function() {
        removeAppFormLoader(form)
    })

})
