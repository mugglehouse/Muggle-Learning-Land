// 1、声明构造函数
function Promise(executor) {
    // 添加属性
    this.PromiseState = 'pending'
    this.PromiseResult = null;
    // 声明属性（用于保存所有then各自的resolve,reject回调函数）
    this.callbacks = []

    // 保存实例对象的this值（因为后面的resolve和reject函数是直接被调用的，所以他们的this指向window）
    const _this = this

    // resolve函数
    function resolve(data) {
        // 判断，promise状态只能被修改一次
        if (_this.PromiseState !== 'pending') return;
        // 修改promise状态（promiseState）
        _this.PromiseState = 'fullfilled';
        // 修改promise结果（promiseResult）
        _this.PromiseResult = data;
        // 用forEach将所有then遍历出来
        _this.callbacks.forEach(item => {
            // 调用成功回调
            item.onResolved(data)
        })

    }
    // reject函数
    function reject(data) {
        // 判断，promise状态只能被修改一次
        if (_this.PromiseState !== 'pending') return;
        // 修改promise状态（promiseState）
        _this.PromiseState = 'rejected';
        // 修改promise结果（promiseResult）
        _this.PromiseResult = data;
        // 用forEach将所有then遍历出来
        _this.callbacks.forEach(item => {
            // 调用失败回调
            item.onRejected(data)
        })
    }
    // throw 抛出错误改变状态
    try {
        // 同步调用执行器函数
        executor(resolve, reject);
    } catch (e) {
        reject(e)
    }


}

//2、添加then方法(then是由Promise调用的，所以then中的this也指向promise实例)
Promise.prototype.then = function(onResolved, onRejected) {
    // 保存this
    const _this = this;
    // 判断回调函数参数（catch的异常穿透）
    if (typeof onRejected !== 'function') {
        onRejected = reason => {
            throw reason
        }
    }
    // 值传递
    if (typeof onResolved !== 'function') {
        onResolved = value => value
    }
    // then返回一个promise对象
    return new Promise((resolve, reject) => {
        // 封装函数
        function callback(type) {
            try {
                //获取回调函数的执行结果，为then的返回结果
                let result = type(_this.PromiseResult);
                // 判断
                if (result instanceof Promise) {
                    // then结果的状态由then返回的promise决定
                    result.then(
                        v => {
                            resolve(v)
                        },
                        r => {
                            reject(v)
                        }
                    )
                } else {
                    // then结果的状态变为成功，值为回调函数return的结果
                    resolve(result)
                }
            } catch (e) {
                reject(e)
            }
        }
        // 调用回调函数
        if (this.PromiseState === 'fullfilled') {
            callback(onResolved)
        }
        if (this.PromiseState === 'rejected') {
            // onRejected(this.PromiseResult)
            callback(onRejected)
        }
        // 判断pending状态
        if (this.PromiseState === 'pending') {
            // 保存回调函数(保存多个回调)，这里用一个对象封装起来了，所有this会指向这个对象
            this.callbacks.push({
                // 在异步执行then结果时
                onResolved: function() {
                    callback(onResolved)
                },
                onRejected: function() {
                    callback(onRejected)

                }
            })
        }
    })
}

// 添加catch方法
Promise.prototype.catch = function(onRejected) {
    return this.then(undefined, onRejected)
}