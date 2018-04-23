/*
 * @Description: 虚拟身份证键盘
 * @Author: ls 
 * @Date: 2018-04-10 08:48:08 
 * @Last Modified by: ls
 * @Last Modified time: 2018-04-13 11:05:57
 */
/*
    //将已有input构建成虚拟身份证键盘
    //使用方法如下，目前支持参数如下：
    $('input').idkb({
        oneWidth: 9, //虚拟input中一个字符的宽度
        fontSize: 16, //虚拟input中字大小
        handleWidth: 13, //光标mouse拖拽句柄px值
    });
*/


(function($){
    var tof = Object.prototype.toString,
        slice = Array.prototype.slice,
        sRe = /\s+/ig;

    var allInstance = [], //将所有的实例存于此
        $preVirtual = null, //上次聚焦的虚拟
        $actVirtual = null, //当前聚焦的虚拟input
        $actReal = null, //当前聚焦对应的真实input
        isTriggerIfocus = false; //代码触发iFocus

    //构造函数
    function KeyBoard(options){
        //默认属性
        var opt = {
            oneWidth: 9, //虚拟input中一个字符的宽度
            fontSize: 16,//虚拟input中字大小
            handleWidth: 13, //光标mouse拖拽句柄px值  
        };

        //用户自定义的options存在
        if(options && tof.call(options) === "[object Object]"){
            opt = $.extend(opt, options);
            opt.adjust = (opt.handleWidth-1)/2; //使光标mouse居中的调整px值
        }
        this.opt = opt;
        this.actVid = ''; //当前聚焦的虚拟input的id(点击.idkb_virtual_input时产生)

        //初始化
        this._addStyle();
        this._renderDom();
        this._remouldInput();
        this._bindEv();
    }

    //渲染键盘dom
    KeyBoard.prototype._renderDom = function(){
        var html = '<div id="idkb" class="css-idkb"><p><em id="idkb_shrink"></em></p><ul>',
            keyTxt, 
            keyClass;

        //如果已经存在键盘dom则退出
        if($('#idkb').length){
            return;
        }

        // 组装键盘html
        for(var i = 1; i<=12; i++){
            switch(i){
                case 10:
                    keyTxt = 'X';
                    keyClass = 'idkb_num idkb-x';
                    break;
                case 11:
                    keyTxt = 0;
                    keyClass = 'idkb_num';
                    break;
                case 12:
                    keyTxt = 'del';
                    keyClass = 'idkb_del';
                    break;
                default:
                    keyTxt = i;
                    keyClass = 'idkb_num';
                    break;
            }
            html += '<li class="'+ keyClass +'" data-val="'+ keyTxt +'"><span>'+keyTxt+'</span></li>';
            if(i%3 == 0 && i!=12){
                html += '</ul><ul>';
            }
        }
        html += '</ul></div>';
        $(html).appendTo('body');
    }

    //动态插入样式
    KeyBoard.prototype._addStyle = function(){
        var styleHtml = '<style id="idkb-style">\
            .css-idkb{display:none;position:fixed; bottom:0; width:100%; height:40%; background-color:#fff;z-index:1001}\
            .css-idkb p{height:16%; background-color:#D2D5DC; text-align:center;}\
            .css-idkb p em{display:inline-block;width:50px;height: 100%;}\
            .css-idkb p em:before {content: "";display: inline-block;width: 3px;height: 60%;background-color: #Fff;transform: rotate(-50deg);transform-origin: bottom;position: relative;left: 2px;top: 4px;}\
            .css-idkb p em:after {content: "";display: inline-block;width: 3px;height: 60%;background-color: #fff;transform: rotate(50deg);transform-origin: bottom;position: relative;left: -2px;top: 4px;}\
            .css-idkb ul{display:flex; height:21%; border-top:1px solid #D2D5DC;}\
            .css-idkb ul li:nth-child(2){border:1px solid #D2D5DC; border-top:0; border-bottom:0;}\
            .css-idkb ul:nth-of-type(4){background-color:#D2D5DC;}\
            .css-idkb ul:nth-of-type(4) li:nth-child(2){background-color:#fff;}\
            .css-idkb li{flex:1; display:flex; align-items:center; text-align:center;}\
            .css-idkb li.idkb_active{background-color:#D2D5DC !important;}\
            .css-idkb li span{flex:1; font-size:30px; user-select:none;}\
            /*.idkb_real_input{opacity:0 !important;}*/\
            .idkb_virtual_input{font-size:'+ this.opt.fontSize +'px;display:flex;align-items:center;position:absolute;user-select: none;}\
            .idkb_virtual_input p{width:'+ this.opt.oneWidth +'px;}\
            .idkb_virtual_input .idkb_virtual_num:nth-of-type(6){padding-right:'+ this.opt.oneWidth +'px;}\
            .idkb_virtual_input .idkb_virtual_num:nth-of-type(14){padding-right:'+ this.opt.oneWidth +'px;}\
            input.idkb_hide{opacity:0}\
            .idkb_del{background:url("http://file.40017.cn/img140017cnproduct/touch/bus/wx_bus/idkb_del.png") no-repeat scroll 50% 50%;background-size: 30%;}\
            .idkb_del span{color:transparent}\
            #mouse{position:relative;width: '+this.opt.handleWidth+'px;height: 100%;background-color: #09bb07;transform: scaleY(0.4);top: 40%;left: -'+this.opt.adjust+'px;margin-right: -'+this.opt.handleWidth+'px;border-radius: 48%;}\
            #mouse i{height:100%;width:1px;background-color:#000;display:block;-webkit-animation: mouse 1s linear infinite;position: relative;top: -100%;left: '+this.opt.adjust+'px;}\
            @-webkit-keyframes mouse{\
                0%{opacity:1}\
                50%{opacity:0;}\
                100%{opacity:1}\
            }\
        </style>';
        $('#idkb-style').remove(); //如果样式存在，删除dom，再插入样式标签
        $(styleHtml).appendTo('body');
    }

    //改造input
    KeyBoard.prototype._remouldInput = function(){
        //为使用身份证键盘的input的元素添加包裹div、class 及 标识
        if(this.opt.$the.length){

            this.opt.$the.forEach(function(ele, idx){
                //如果未插入虚拟input
                if(!$(ele).siblings('.idkb_virtual_input').length){
                    var $ele = $(ele), //input
                        $parent = $(ele).parent(), //input 父级
                        val = $ele.val() ? $ele.val().replace(sRe,'') : '',//input值
                        eleW = $ele.width(), //原input宽
                        eleH = $ele.height(),//原input高
                        elePos, //input距离父级的top,left
                        eleZIdx = parseInt($ele.css('z-index')) || 0, //原input默认z-index
                        virtualZIdx = eleZIdx ? (eleZIdx+1) : 1, //虚拟input z-index
                        domID = randomId();                            

                    $parent.css('position', 'relative');
                    elePos = $ele.position();

                    $ele.addClass('idkb_real_input').addClass(domID);
                    var html = '<div id='+domID+' class="idkb_virtual_input" style="top:'+elePos.top+'px; left:'+ elePos.left +'px;width:'+eleW+'px;height:'+eleH+'px;z-index:'+virtualZIdx+'">';
                    for(var i=0; i<val.length; i++){
                        html += '<p class="idkb_virtual_num">'+ val[i] +'</p>';
                    }
                    html += '</div>';

                    var $virtualInput = $(html).insertBefore($ele);
                    togglePH($virtualInput, $ele);
                }
            });                     
        }
    }

    //事件绑定
    KeyBoard.prototype._bindEv = function(){
        var that = this;

        //绑定事件之前卸载所有事件，防止多次实例化造成多次绑定
        this._unloadEv();                

        //<div><p></p></div>点击p时，按照绑定在document上的顺序依次执行，而不是按照冒泡顺序
        $(document).on('click.idkb', '.idkb_virtual_input', idkbShow.bind(that));//点击虚拟input
        $(document).on('click.idkb', '.idkb_virtual_input .idkb_virtual_num', changeMousePos);//点击虚拟键盘中的数字切换光标位置
        $(document).on('click.idkb', idkbHide); //点击非虚拟键盘、非虚拟input区域隐藏键盘
        $(document).on('click.idkb', '.idkb_num', clickNum);//点击数字                
        $(document).on('click.idkb', '.idkb_del', clickNum);//点击删除键
        $(document).on('click.idkb', '#idkb_shrink', altKB.bind(that));//收缩键盘按钮

        //touchstart，处理虚拟键盘active样式和长按删除----------------------------------------
        $(document).on('touchstart.idkb', '#idkb li', function(e){
            var isClickDel = $(e.target).closest('li').hasClass('idkb_del'), //点击的是删除键
                tOutTimer,
                deleteTimer;

            //按下的是删除，且是长按
            if(isClickDel){
                var autoDelete = function(){
                        if( $('#mouse').prev('.idkb_virtual_num').length ){
                            $('#mouse').prev('.idkb_virtual_num').remove();
                        }else{
                            clearInterval(deleteTimer);
                        }
                    };

                tOutTimer = setTimeout(function(){
                    //console.log('处理长按删除')
                    deleteTimer = setInterval(function(){
                        //console.log('每隔100毫秒删除')
                        autoDelete();
                    }, 100);
                },500);
            }                    

            $(this).addClass('idkb_active'); //添加active样式
            e.preventDefault(); //防止在安卓中出现“在浏览器中打开”

            // touchend
            $(document).on('touchend.idkb', '#idkb li', function(e){
                //长按删除
                if(isClickDel){
                    clearTimeout(tOutTimer);                        
                    clearInterval(deleteTimer);
                }

                $('#idkb li').removeClass('idkb_active'); //删除active样式                        
                $(document).off('touchend.idkb');
            });
        });

        //touchstart-拖拽光标------------------------------------------
        $(document).on('touchstart.idkb', '#mouse', function(e){ //touchstart
            //console.log('touchstart');
            //console.log(e.touches[0]);
            // 拖拽边界
            var $parent = $(this).parent('.idkb_virtual_input'),
                limitL = 0 - that.opt.adjust, //光标因默认样式向右移动了3px
                limitR = $parent.children('.idkb_virtual_num').length * that.opt.oneWidth + that.opt.adjust*2,
                finalLeft; //光标最终left值

            // 记录触摸位置
            var startTouch = e.touches[0],
                startX = startTouch.clientX;
                //console.log('startX: ',startX);
                //console.log('\r\n');

            // 记录光标为relative时的left
            var relativeLeft = $(this).css('left');

            // 以光标编当前位置改为绝对定位
            var mStartPos = $(this).position();
            $(this).css({
                'position': 'absolute',
                'left': mStartPos.left + 'px',
            });

            $('#mouse').on('touchmove.idkb', function(e){ //touchmove
                //console.log('touchmove');
                var moveTouch = e.touches[0],
                    moveX = moveTouch.clientX,
                    disX = moveX - startX;

                finalLeft = mStartPos.left + disX; //光标位置为touchstart时的left值 + 差值

                //console.log('moveX: ',moveX);
                //console.log('disX', moveX - startX);
                //console.log('\r\n');

                //边界处理
                if(finalLeft <= limitL){
                    finalLeft = limitL;
                }
                if(finalLeft >= limitR){
                    finalLeft = limitR
                }

                // if(disX % that.opt.oneWidth == 0){
                    //最终移动至finalLeft
                    $(this).css({
                        'left': finalLeft
                    });
                // }

                e.preventDefault();
            });

            $('#mouse').on('touchend.idkb', function(e){ //touchend
                //console.log('touchend');
                var index,
                    $allP = $(this).siblings('p.idkb_virtual_num'),
                    sumWidth = 0;

                finalLeft = finalLeft + that.opt.adjust; //最终left值加上调整值

                //落位
                for(var i=1; i<=$allP.length; i++){
                    var $p = $($allP[i-1]),
                        currentPWidth = $p.width(),
                        idx = i-1, //索引从0开始
                        prevSumWidth = sumWidth;
                    sumWidth += currentPWidth;
                    if(finalLeft<0) finalLeft = 0;
                    if(finalLeft >= prevSumWidth && finalLeft <= sumWidth){
                        var surplus = finalLeft - prevSumWidth;
                        if(surplus >= currentPWidth/2){
                            $(this).insertAfter($allP.eq(idx));
                        }else{
                            $(this).insertBefore($allP.eq(idx));
                        }

                        break;
                    }
                    //光标的left值大于所有数字宽度合
                    else if(i == $allP.length){//最后一个
                        $(this).insertAfter($allP.eq(idx));
                    }
                }

                //console.log('finalLeft:',finalLeft);
                //console.log('adjust:',that.opt.adjust);
                //console.log('finalLeft+adjust:',finalLeft + that.opt.adjust);


                // 将光标转为相对定位
                setTimeout(function(){
                    $('#mouse').css({
                        'position': 'relative',
                        'left': relativeLeft,
                    });
                }, 100)


                // 事件解绑
                $('#mouse').off('touchmove.idkb');
                $('#mouse').off('touchend.idkb');
            });
        });
    }

    //事件解绑
    KeyBoard.prototype._unloadEv = function(){
        $(document).off('click.idkb');
        $(document).off('touchstart.idkb');
    }


    // for user api
    //销毁
    KeyBoard.prototype.destroy = function(){
        var that = this;

        allInstance.forEach(function(item, idx){
            if(item == that){
                allInstance.splice(idx, 1);
            }
        });

        //解除所有事件绑定
        this._unloadEv();

        //所有实例都销毁，删除共用的虚拟键盘、虚拟鼠标
        if(allInstance.length<=0){
            $('#idkb').remove();
            $('#mouse').remove();
            $(window).off('popstate.idkb');
        }

        // 删除当前实例动态添加的dom
        this.opt.$the.siblings('.idkb_virtual_input').remove();
        this.opt.$the.removeClass('idkb_real_input').removeClass('idkb_hide');
    }

    //隐藏
    KeyBoard.prototype.hide = pureHide;

    //聚焦
    KeyBoard.prototype.ifocus = function(){
        isTriggerIfocus = true;
        var id = '#' + this.actVid;
        if($(id).length){
            $actVirtual = $(id);
            $actReal = $('.' + this.actVid);
            $('#idkb').show();//显示键盘
            $('#mouse').remove(); //删除非活动对象其他光标                
            $(id).append('<span id="mouse"><i></i></span>');//光标显示在末尾
        }
    }

    //纯隐藏功能
    function pureHide(){
        $('#idkb').hide();//dom隐藏   
        $preVirtual = $actVirtual;             
        $actVirtual = null;//清空聚焦对象                
        $('#mouse').remove();//删除光标
    }

    //切换键盘隐藏虚拟键盘 or 隐藏虚拟键盘
    function altKB (){

        //以下为切换原生input功能（暂时不开启）
        if(false){
            var virtualId = this.actVid,
                $vir = $('#'+virtualId),
                $real = $('.' + virtualId);

            $vir.hide(); //隐藏虚拟键盘
            $real.focus(); //聚焦真实input
            $real.removeClass('idkb_hide'); //显示真实input

            //当真实input失去焦点
            $real.one('blur.idkb', function(){
                var val = $real.val() ? $real.val().replace(sRe,'') : '',
                    html = '';

                //同步真实input中的值
                for(var i=0; i<val.length; i++){
                    html += '<p class="idkb_virtual_num">'+ val[i] +'</p>';
                }

                //显示虚拟input
                $('#' + virtualId).html(html).show();
                val.length && $real.addClass('idkb_hide'); //真实input有值，则将其opacity设置为0
            });
        }

        //无切换功能，向下的箭头点击后单纯的隐藏键盘
        pureHide();
    }

    //util function
    //模拟虚拟键盘显示，虚拟input聚焦
    function idkbShow(e){
        var $target = $(e.target),
            $prevVirtual = $actVirtual;

        //更新当前活动对象
        $actVirtual = $target.closest('.idkb_virtual_input');
        $actReal = $actVirtual.siblings('input.idkb_real_input');
        this.actVid = $actVirtual.attr('id');

        //$prevVirtual为null，代表失焦状态
        //如果点击的虚拟input相同 且 键盘已显示则退出
        if( $prevVirtual != null && 
            $prevVirtual.attr('id') == $actVirtual.attr('id') && 
            $('#idkb').css('display') == 'block') {

                if($target.hasClass('idkb_virtual_input')){ //点击的是虚拟inpu旁白区域（非数字）
                    $('#mouse').remove(); //删除非活动对象其他光标                
                    $actVirtual.append('<span id="mouse"><i></i></span>');//光标显示在末尾
                }
                return;
        }

        // 定时器防止从姓名原生键盘切回虚拟键盘产生显示问题
        setTimeout(function(){
            $('#idkb').show();//显示键盘
            $('#mouse').remove(); //删除非活动对象其他光标                
            $actVirtual.append('<span id="mouse"><i></i></span>');//光标显示在末尾
        },400);

        return false;
    }

    //模拟虚拟input失去焦点，模拟键盘隐藏
    function idkbHide(e){
        var $target = $(e.target);

        //用户代码触发ifocus
        if(isTriggerIfocus){
            isTriggerIfocus = false;
            return false;
        }

        //点击键盘区域不隐藏
        if($target.closest('#idkb').length){
            return false;
        }

        //点击光标不隐藏
        if($target.attr('id') == 'mouse'){
            return false;
        }

        //点击虚拟input之外的dom隐藏
        if(!$target.closest('.idkb_virtual_input').length){
            $('#idkb').hide();//dom隐藏

            //清空聚焦对象
            $preVirtual = $actVirtual;
            $actVirtual = null;

            //删除光标
            $('#mouse').remove();
        } 
    }

    //根据点击的数字更改光标位置
    function changeMousePos(e){
        // alert('点击了inner')
        var $target = $(e.target),
            $mouse = $('#mouse').remove();

        $mouse.insertAfter($target);
        return false;
    }

    //点击键盘各键
    function clickNum(e){
        var actInputVal = $actReal.val().replace(sRe, ''),
            clickKeyVal = $(this).data('val'),
            isClickDel = $(this).hasClass('idkb_del'),
            newVal = [];

        if(isClickDel){
            $('#mouse').prev('.idkb_virtual_num').remove();
        }else{
            if($actVirtual.children('.idkb_virtual_num').length <= 17){
                $('<p class="idkb_virtual_num">'+clickKeyVal+'</p>').insertBefore('#mouse');
            }
        }
        togglePH($actVirtual, $actReal);

        $actVirtual.children('.idkb_virtual_num').forEach(function(item){
            newVal.push($(item).text());
        });
        $actReal.val(newVal.join(''));
        $actReal.trigger('input');

        // var target = $(e.currentTarget);
        // this.funCheckInputPassenger(target.val().replace(/ /g, ''), target);

        //console.log('虚拟input ID：',$actVirtual.attr('id'));
        //console.log('虚拟input 值：',newVal.join(''));
        //console.log('真实input 值：',$('.'+$actVirtual.attr('id')).val());
        //console.log('\r\n')
    }

    //显示or隐藏placeholder
    function togglePH($virtualInput, $realInput){
        if($virtualInput.children('.idkb_virtual_num').length <= 0){
            $realInput.removeClass('idkb_hide');
        }else{
            $realInput.addClass('idkb_hide');
        }

    }

    //生成随机数
    function randomId (){
        return 'idkb_' + new Date().getTime() + '' + parseInt(Math.random()*1000);
    }


    //添加Zepto方法
    $.fn.idkb = function(options) {
        //console.log(this);
        //console.log(this.length);

        /* 实例化操作：
        $('input').idkb({})
        $(this)获取的元素就是input，都需要转换为触发身份证键盘的元素
        */

        var ins; 
        if(!options){
            options = {};
        }
        options.$the = $(this); //当前涉及的input 

        ins = new KeyBoard(options); //新建实例

        //初始化第一个实例，监听路由
        if(allInstance.length == 0){  
            //路由发生变化隐藏键盘
            $(window).on('popstate.idkb', function(event) {
                if($('#idkb').length && $('#idkb').css('display') == 'block'){
                    ins.hide();
                }
            });
        }

        allInstance.push(ins);
        return ins; //返回实例
    }
})($)
