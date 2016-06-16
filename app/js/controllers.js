/**
 * Created by Administrator on 2016/2/18.
 */
angular.module('chetongxiang.controllers',[]).controller('LoginController',['$rootScope','$scope','$cookieStore','ResourceService','AuthService','CookieService',function($rootScope,$scope,$cookieStore,ResourceService,AuthService,CookieService){
   //本地用户名
    $scope.account={
        account:$cookieStore.get('NAME')||null
    };
    //记住用户名
    $scope.remember=true;
    $scope.login=function(dialog){
        if($scope.loginForm.$valid){
            $scope.account.pwd=hex_md5($scope.account.pwd);
            ResourceService.getFunServer('oalogin',$scope.account,'post').then(function(data){
                if(data.status){
                    AuthService.Login(data.data);
                    $rootScope.USER=data.data;
                    $rootScope.state.go('admin.welcome');
                    //记住用户名
                    if($scope.remember){
                        CookieService.SetCookie('NAME',$scope.account.account)
                    }
                    else{
                        CookieService.RemoveCookie('NAME');
                    }
                }
                else{
                   layer.msg(data.message||"登录失败");
                }

            })
        }
    };
    //退出
    $scope.loginOff=function(){
        ResourceService.getFunServer('loginout',{}).then(function(data){
            AuthService.LoginOut();
            if(data.status==1){
                AuthService.LoginOut();
            }

        });
    };
    //回车提交
    $scope.submitKey=function(e,dialog){
        var keyCode=window.event? e.keyCode: e.which;
        if(keyCode==13){
           $scope.login();
        }
    }
}]).controller('SidebarController', ['$rootScope', '$scope', '$state', '$http', '$timeout',
    function($rootScope, $scope, $state, $http, $timeout){
        // Check item and children active state
        var isActive = function(item) {

            if(!item) return;

            if( !item.sref || item.sref == '#') {
                var foundActive = false;
                angular.forEach(item.submenu, function(value, key) {
                    if(isActive(value)) foundActive = true;
                });
                return foundActive;
            }
            else
                return $state.is(item.sref) || $state.includes(item.sref);
        };
        //sidebar allow access
        var isAccess=function(items) {
            if(!items) return;
            var list=[];
            angular.forEach(items, function(value, key) {
                if( value.access&&value.access.indexOf("-1")>-1) {
                    list.push(value);
                }
                if( value.access&&value.access.indexOf($rootScope.USER&&$rootScope.USER.IdentityTag)>-1) {
                    list.push(value)
                }
                else{
                    return null;
                }
            });
            return list;
        };

        // Load menu from json file
        // -----------------------------------

        $scope.getMenuItemPropClasses = function(item) {
            return (item.heading ? 'nav-heading' : '') +
                (isActive(item) ? ' active' : '') ;
        };

        $scope.loadSidebarMenu = function() {

            var menuJson = 'data/sidebar-menu.json',
                menuURL  = menuJson + '?v=' + (new Date().getTime()); // jumps cache
            $http.get(menuURL)
                .success(function(items) {
                    $scope.menuItems = isAccess(items);
                })
                .error(function(data, status, headers, config) {
                    alert('Failure loading menu');
                });
        };

        $scope.loadSidebarMenu();


    }]).controller('CarController',['$scope','$rootScope','$compile','ResourceService','CarService',"$http",function($scope,$rootScope,$compile,ResourceService,CarService,$http){
    //筛选条件
    $scope.filter={
        PageNo:$scope.currentPage,
        BrandID: null,
        CountryID: null,
        CarFlag: null,
        OnlineFlag:null,
        CityID:null,
        StyleID:null,
        CarCount_Start:null,
        CarCount_End:null,
        Price_Start:null,
        Price_End:null
    };
    $scope.searchlist=function(){
        if(isNaN($scope.filter.CarCount_Start)||isNaN($scope.filter.CarCount_End)||$scope.filter.CarCount_Start<1){
            $scope.filter.CarCount_Start=null;
            $scope.filter.CarCount_End=null;
        }
        if($scope.filter.CarCount_Start&&$scope.filter.CarCount_End<$scope.filter.CarCount_Start){
            $scope.filter.CarCount_End=$scope.filter.CarCount_Start;
        }
        if(isNaN($scope.filter.Price_Start)||isNaN($scope.filter.Price_End)||$scope.filter.Price_Start<0){
            $scope.filter.Price_Start=null;
            $scope.filter.Price_End=null;
        }
        if($scope.filter.Price_Start&&$scope.filter.Price_End&&parseFloat($scope.filter.Price_End)<parseFloat($scope.filter.Price_Start)){
            $scope.filter.Price_End=$scope.filter.Price_Start;
        }
        $scope.getList();
    };
    $scope.clearsearch=function(){
        $scope.filter={
            PageNo:$scope.currentPage,
            BrandID: null,
            CountryID: null,
            CarFlag: null,
            OnlineFlag:null,
            CityID:null,
            StyleID:null,
            CarCount_Start:null,
            CarCount_End:null,
            Price_Start:null,
            Price_End:null
        };
        $scope.unit_province=null;
        $scope.getList();
    };
    //提车地信息
    $scope.getunit=function(){
        ResourceService.getFunServer("unitall",{}).then(function(data){
             if(data.data){
                 $scope.unitlist=data.data;
             }
        })
    };
    $scope.list=[];
    $scope.car={
        PriceAgioMax:0
    };
    $scope.getList=function(){
        ResourceService.getFunServer('carlist',$scope.filter).then(function(data){
            if(data.status==1){
                $scope.list=data.data;
                $scope.pageTotal=data.count;
            }
        })
    };
    //优惠价
    $scope.$watch("Price",function(newValue){
        if($scope.car.PriceMarket){
            $scope.car.PriceAgioMax=parseFloat($scope.car.PriceMarket-newValue).toFixed(2);
        }
    });
    $scope.$watch("car.PriceMarket",function(newValue){
          if(newValue>0){
              var agio=$(".agio");
              $.each(agio,function(index,obj){
                  var price=$(obj).parent().prev().find("input[type=text]").val();
                  if(price>0){
                      $(obj).text(parseFloat(newValue-price).toFixed(2))
                  }
              });
          }
    });
    //翻页
    $scope.changePager=function(){
        $scope.filter.PageNo=$scope.currentPage;
        $scope.getList();
    };
    //上架
    $scope.rack=function(_carno){
       layer.confirm('确认要上架吗？',function(index){
           if(index){
               ResourceService.getFunServer('rack',{CarNo:_carno}).then(function(data){
                   if(data.status==1){
                       layer.msg('已上架!',{icon:1,time:1000},function(){
                           $scope.getList();
                       });
                   }else{
                       data.message&&layer.msg('操作失败,'+data.message,{icon:5,time:1000})||layer.msg('操作失败!',{icon:5,time:1000});
                   }
               })
           }
       });
   };
    //下架
    $scope.soldout=function(_carno){
        layer.confirm('确认要下架吗？',function(index){
            if(index){
                ResourceService.getFunServer('soldout',{CarNo:_carno}).then(function(data){
                    if(data.status==1){
                        layer.msg('已下架!',{icon:1,time:1000},function(){
                            $scope.getList();
                        });

                    }else{
                        data.message&&layer.msg('操作失败,'+data.message,{icon:5,time:1000})||layer.msg('操作失败!',{icon:5,time:1000});
                    }
                })
            }
        });
    };
    //删除
    $scope.deletecar=function(obj){

        if(obj.OnlineFlag==1){
            layer.msg('请先下架车辆',{icon:8,time:1000});
            return false;
        }
        layer.confirm('确认要删除吗？',function(index){
            if(index){
                ResourceService.getFunServer('detetecar',{CarNo:obj.CarNo}).then(function(data){
                    if(data.status==1){
                        layer.msg('已删除!',{icon:1,time:1000},function(){
                            $scope.getList();
                        });
                    }else{
                        layer.msg('操作失败',{icon:5,time:1000});
                    }
                })
            }
        });
    };
    $scope.deletebar=function(){
        layer.confirm('确认要删除吗？',function(index){
            if(index){
                ResourceService.getFunServer('detetecar',{CarNo:$rootScope.stateParams.CarNo}).then(function(data){
                    if(data.status==1){
                        layer.msg('已删除!',{icon:1,time:1000},function(){
                            $rootScope.state.go("admin.car");
                        });
                    }else{
                        layer.msg('操作失败',{icon:5,time:1000});
                    }
                })
            }
        });
    };
    //搜索
    $scope.searchFilter=function(item){
        if($scope.search){
            return item.FullName&&item.FullName.indexOf($scope.search)>-1;
        }
        else{
            return item;
        }
    };
    //发布
    $scope.savecar=function(){
        //配置信息
        $scope.car.Readme=$scope.editor.$txt.html();
        //外观颜色
        $scope.car.ColorOutID=$("#ColorOutID").data('color');
        //内饰颜色
        $scope.car.ColorInID=$("#ColorInID").data('color');
        //车辆状态
        $scope.car.CarFlag=$(".car-flag.active").data("value");
        //类别
        $scope.car.StyleID=$(".car-style.active").data("value");
        //期货时间
        if($scope.car.CarFlag==4){
            $scope.car.FuturesTime=$("#FuturesTime").val();
        }else{
            delete  $scope.car.FuturesTime;
        }
        //报价
        $scope.car.CarOffers=[];
        if(document.getElementById("radio-1").checked){
            $scope.car.Price=$scope.Price;
        }else if(document.getElementById("radio-2").checked){
            $scope.car.Price=0;
            var prices=$(".take-content");
            $.each(prices,function(index,obj){
                var $el=$(obj);
                var city_name=$el.find("select[name=city]").find("option:selected").text();
                var unitcode=$el.find("select[name=city]").val();
                var province_name=$el.find("select[name=province]").find("option:selected").text();
                var price=$el.find("input.input-text").val();
                var agio=$el.find(".agio").text();
                var o=new Object();
                o.City=city_name;
                o.Price=price;
                o.Province=province_name;
                o.UnitCode=unitcode;
                o.PriceAgioMax=agio;
                $scope.car.CarOffers.push(o);
            })
        }
        //车辆图片

        var cover=$(".set-cover").data("path");
        var car_pics = $(".filelist li:not(.set-cover)");
        if(cover){
            $scope.car.CoverImgURL=cover;
        }
        else{
            $scope.car.CoverImgURL=car_pics.eq(0).data("path");
        }

        $scope.car.CarPics = [];
        $.each(car_pics,function(index,obj){
          var o=new  Object();
          var pic_url=$(obj).data("path");
           o.PicAddr=pic_url;
           o.SerialNO=index+1;
          if(cover){
              $scope.car.CarPics.push(o);
          }
          else{
              if(index>0){
                  $scope.car.CarPics.push(o);
              }
          }
        });
        if($scope.carForm.$invalid||!$scope.car.ColorInID||!$scope.car.ColorOutID||($scope.car.CarFlag==4&&!$scope.car.FuturesTime)||(!$scope.car.Price&&$scope.car.CarOffers.length==0)||!$scope.car.Readme){
            layer.msg('车辆信息还未填写完整，无法保存',{icon:0,time:2000});
            return;
        }
        if(!$scope.car.CoverImgURL){
            layer.msg('请上传车辆封面图',{icon:0,time:2000});
            return;
        }
        CarService.Save($scope.car).success(function(data){
            if(data.status==1){
                layer.msg('发布成功',{icon:1,time:1000},function(){
                    $rootScope.state.go('admin.car');
                });
            }else{
                layer.msg(data.message||"提交失败",{icon:5,time:1000});
            }
        });

    };
    //获取车辆信息
    $scope.getCar=function(){
        var params={
            CarNo:$rootScope.stateParams.CarNo
        };
        ResourceService.getFunServer("car",params).then(function(data){
                $scope.car=data;
                $scope.Price=$scope.car.Price;
                $scope.getunit();
                setTemp($scope.car);
        });
    };
    //页面数据
    var setTemp=function(obj){
        if(!obj){
            return false;
        }
        if(obj.CarOffers&&obj.CarOffers.length>0){
            ResourceService.getFunServer("unitall",{}).then(function(data){
                if(data.data){
                    $scope.unitlist=data.data;
                    document.getElementById("radio-2").checked=true;
                    angular.forEach(obj.CarOffers,function(o,index){

                        var  stpl=$compile('<div class="take-content clearfix mt-10" edittake-city><span class="f-l">'+
                            '<span class="select-box inline">'+
                            '<select name="province" class="select" >'+
                            '<option value="">请选择省份</option>'+
                            '<option value="{{p.Province}}" ng-repeat="p in unitlist" ng-selected="p.Province==\''+ o.Province+'\'">{{p.Province}}</option>'+
                            '</select>'+
                            '</span>'+
                            '<span class="select-box inline ml-5">'+
                            '<select name="city"    class="select" >'+
                            '<option value="">请选择城市</option>'+
                            '</select>'+
                            '</span>'+
                            '</span>'+
                            '<span class="select-box inline f-l ml-5">'+
                            '<input type="text" class="input-text input-noborder" style="width:90px;">万元'+
                            '</span>'+
                            '<span class="f-l" style="line-height: 31px;margin-left: 15px">优惠 <span class="c-danger agio">0</span> 万</span>'+
                            '<span class="take-del f-l"><i class="Hui-iconfont Hui-iconfont-shenhe-tingyong"></i></span></div>')($scope);
                        $(".take-container").append(stpl);
                        $(stpl).find(".input-text").val(o.Price);
                        $(stpl).find(".agio").text(o.PriceAgioMax);
                        angular.forEach($scope.unitlist,function(u,index){
                            if(u.Province== o.Province){

                                $.each(u.Citys, function (i, c) {
                                    if (c.City==o.City) {
                                        var opt = "<option value='" + c.UnitCode + "' selected>" + c.City + "</option>";
                                    } else {
                                         opt = "<option value='" + c.UnitCode + "'>" + c.City + "</option>";
                                    }
                                    $(stpl).find(".select[name=city]").append(opt)

                                })
                            }
                        });
                    });
                }
            })

        }
        else{
            document.getElementById("radio-1").checked=true;
        }
        if(obj.Readme&&$scope.editor){
           $scope.editor.$txt.html(obj.Readme);
        }
        //封面
        if(obj.CoverImgURL){
            $(".queueList .placeholder").hide();
            var tpl=$('<li id="" class="file-preview-frame set-cover" data-path="'+obj.CoverImgURL+'"  data-cover="1"><p class="title"></p><p class="imgWrap"><img src="'+obj.CoverImgURL+'"></p><p class="progress"><span></span></p><p class="cover-btn">封面图</p><div class="file-panel" ><span class="cancel"><i class="Hui-iconfont Hui-iconfont-del"></i></span></div></li>');
            $(".filelist").append(tpl);
            $(".filelist li").on('mouseenter', function () {
                $(this).find(".file-panel").stop().animate({height: 30});
            }).on('mouseleave', function () {
                $(this).find(".file-panel").stop().animate({height: 0});
            });
            $(".file-panel").on('click', 'span.cancel', function () {
                $(this).parents("li").remove();
                if($(".filelist li").length==0){
                    $(".queueList .placeholder").show();
                }
            });

        }if(obj.CarPics&&obj.CarPics.length>0){
            $(".queueList .placeholder").hide();
            $.each(obj.CarPics,function(index,o){
                tpl=$('<li id="" class="file-preview-frame" data-path="'+o.PicAddr+'"><p class="title"></p><p class="imgWrap"><img src="'+o.PicAddr+'"></p><p class="progress"><span></span></p><p class="cover-btn">设为封面</p><div class="file-panel" ><span class="cancel"><i class="Hui-iconfont Hui-iconfont-del"></i></span></div></li>');
                $(".filelist").append(tpl);
            });
            $(".cover-btn").on('click',function(){
                $(this).parents("li").addClass("set-cover").attr("data-cover","1").siblings("li").removeClass("set-cover").removeAttr("data-cover").find(".cover-btn").text("设为封面");
                $(this).text('封面图')
            });
            $(".filelist li").on('mouseenter', function () {
                $(this).find(".file-panel").stop().animate({height: 30});
            }).on('mouseleave', function () {
                $(this).find(".file-panel").stop().animate({height: 0});
            });
            $(".file-panel").on('click', 'span.cancel', function () {
                $(this).parents("li").remove();
                if($(".filelist li").length==0){
                    $(".queueList .placeholder").show();
                }
            });
        }
        //类别
        if(obj.StyleID){
            $(".car-style").eq(obj.StyleID-1).addClass("active").siblings().removeClass("active");
        }
        //状态
        if(obj.CarFlag){
            $(".car-flag").eq(obj.CarFlag-1).addClass("active").siblings().removeClass("active");
            if(obj.CarFlag==4){
                $("#FuturesTime").show().val(obj.FuturesTime);
                laydate({
                    elem: "#FuturesTime"
                })
            }
        }
        if(obj.OnlineFlag){
            document.getElementById("checkbox-3").checked=true;
        }
    };
}]).controller('UnitController',['$scope','$rootScope','$compile','ResourceService','CarService',function($scope,$rootScope,$compile,ResourceService,CarService){
    //筛选条件
    $scope.filter={
        PageNo:$scope.currentPage||1,
        Province:null,
        City:null
    };
    $scope.unit={};
    //城市信息
    $scope.province=province;
    $scope.city=[];
    $scope.changeProvince=function(){
        if($scope.Province){
            $scope.city=$scope.Province.city;
            $scope.City=null;
            $scope.map.setCenter($scope.Province.name);
        }
    };
    $scope.changeCity=function(){
        if($scope.City){
            $scope.map.setCenter($scope.City.name);
        }

    };
    $scope.getList=function(){
        ResourceService.getFunServer('unitlist',$scope.filter).then(function(data){
            if(data.status==1){
                $scope.list=data.data;
                $scope.pageTotal=data.count;
            }
        })
    };
    //按城市过滤
    $scope.filterByProvince=function(){
        if($scope.Province){
            $scope.city=$scope.Province.city;
            $scope.filter.CityID_Province=$scope.Province.name;
        }else{
            $scope.city=null;
            $scope.filter.CityID_Province=null;
            $scope.filter.CityID_City=null;
        }
        $scope.getList();
    };
    $scope.filterByCity=function(){
        if($scope.City){
            $scope.filter.CityID_City=$scope.City.name;
        }else{
            $scope.filter.CityID_City=null;
        }
        $scope.getList();
    };
    //翻页
    $scope.changePager=function(){
        $scope.filter.PageNo=$scope.currentPage;
        $scope.getList();
    };
    //删除
    $scope.deleteunit=function(code){
        layer.confirm('确认要删除吗？',function(index){
            if(index){
                var params={
                    UnitCode:code
                };
                ResourceService.getFunServer('deleteunit',params).then(function(data){
                    if(data.status==1){
                        layer.msg('已删除!',{icon:1,time:1000},function(){
                            $scope.getList();
                        });
                    }else{
                        layer.msg(data.message||'操作失败',{icon:5,time:1000});
                    }
                })
            }
        });
    };
    $scope.deletebar=function(){
        layer.confirm('确认要删除吗？',function(index){
            if(index){
                var params={
                    UnitCode:$rootScope.state.ucode
                };
                ResourceService.getFunServer('deleteunit',params).then(function(data){
                    if(data.status==1){
                        layer.msg('已删除!',{icon:1,time:1000},function(){
                            $rootScope.state.go("admin.unit")
                        });
                    }else{
                        layer.msg(data.message||'操作失败',{icon:5,time:1000});
                    }
                })
            }
        });
    };
    //搜索
    $scope.searchFilter=function(item){
        if($scope.search){
            return item.UnionUnit.indexOf($scope.search)>-1||item.UnionBoss.indexOf($scope.search)>-1;
        }
        else{
            return item;
        }
    };
    //提交
    $scope.saveunit=function(){
        if($scope.unitForm.$valid&&$scope.Province&&$scope.City){
            $scope.unit.Province=$scope.Province&&$scope.Province.name;
            $scope.unit.City=$scope.City&&$scope.City.name;
            $scope.unit.CityID=$scope.City&&$scope.City.id;
            ResourceService.getFunServer("saveunit",$scope.unit).then(function(data){
                if(data.status==1){
                    layer.msg('新增成功',{icon:1,time:1000},function(){
                        $rootScope.state.go('admin.unit');
                    });
                }else{
                    layer.msg(data.message||"提交失败",{icon:5,time:1000});
                }
            });
        }else{
            layer.msg('您的信息还未填写完整，无法保存',{icon:0,time:2000});
    }
    };
    //提车地详情
    $scope.getUnit=function(){
        var params={
            UnitCode:$rootScope.stateParams.ucode
        };
        ResourceService.getFunServer("getunit",params).then(function(data){
            if(data){
                $scope.unit=data;
                angular.forEach( $scope.province,function(obj,index){
                    if($scope.unit.Province==obj.name){
                        $scope.Province=obj;
                        $scope.City={
                            id:$scope.unit.CityID,
                            name:$scope.unit.City
                        };
                        $scope.city=obj.city
                    }
                });
                angular.forEach( $scope.city,function(obj,index){
                    if($scope.unit.CityID==obj.id){
                        $scope.City=obj;
                    }
                });
                setMap($scope.unit);
            }
        })
    };
    //设置地图
    function setMap(obj){
        // 百度地图API功能
        if(obj.MapJ&&obj.MapW){
            $scope.map.clearOverlays();
            var point = new BMap.Point(obj.MapJ, obj.MapW);
            var marker = new BMap.Marker(point);
            $scope.map.centerAndZoom(point, 15);
            marker = new BMap.Marker(point);
            marker.addEventListener("dragend",function(){
                var p = marker.getPosition();  //获取marker的位置
                //保存经纬度
                $scope.unit.MapJ=p.lng;
                $scope.unit.MapW=p.lat;
            });
            $scope.map.addOverlay(marker);  // 将标注添加到地图中
            marker.enableDragging();
        }
        else if(obj.Address){
            var options = {
                onSearchComplete: function(results){
                    // 判断状态是否正确
                    if (local.getStatus() == BMAP_STATUS_SUCCESS){
                        $scope.map.clearOverlays();
                        var res=results.getPoi(0);
                        point = new BMap.Point(res.point.lng,res.point.lat);
                        marker = new BMap.Marker(point);
                        $scope.unit.MapJ=res.point.lng;
                        $scope.unit.MapW=res.point.lat;
                        marker.addEventListener("dragend",function(){
                            var p = marker.getPosition();  //获取marker的位置
                            //保存经纬度
                            $scope.unit.MapJ=p.lng;
                            $scope.unit.MapW=p.lat;
                        });
                        $scope.map.addOverlay(marker);             // 将标注添加到地图中
                        marker.enableDragging();
                        $scope.map.centerAndZoom(point, 18);
                    }
                }
            };
            var local = new BMap.LocalSearch($scope.map, options);
            local.search($scope.obj.Address);
        }
    }
    //保存编辑
    $scope.edit=function(){
        if($scope.unitForm.$valid&&$scope.Province&&$scope.City){
            $scope.unit.Province=$scope.Province&&$scope.Province.name;
            $scope.unit.City=$scope.City&&$scope.City.name;
            $scope.unit.CityID=$scope.City&&$scope.City.id;
            ResourceService.getFunServer("editunit",$scope.unit).then(function(data){
                if(data.status==1){
                    layer.msg('编辑成功',{icon:1,time:1000},function(){
                        $rootScope.state.go('admin.unit');
                    });
                }else{
                    layer.msg(data.message||"提交失败",{icon:5,time:1000});
                }
            });
        }else{
            layer.msg('您的信息还未填写完整，无法保存',{icon:0,time:2000});
        }
    }
}]).controller('AppoinController',['$scope','$rootScope','$compile','ResourceService','CarService',function($scope,$rootScope,$compile,ResourceService,CarService){
    //筛选条件
    $scope.currentPage=1;
    $scope.filter={
        PageNo:$scope.currentPage
    };
    $scope.appoin={};
    $scope.getList=function(status){
        $scope.filter.OrderFlag=status;
        ResourceService.getFunServer('appoinlist',$scope.filter).then(function(data){
            if(data.status==1){
                $scope.list=data.data;
                $scope.pageTotal=data.all_count;
                $scope.status_0=data.status0_count;
                $scope.status_1=data.status1_count;
                $scope.status_2=data.status2_count;
            }
        })
    };
    //搜索
    $scope.searchFilter=function(item){
        if($scope.search){
            return item.ContactName.indexOf($scope.search)>-1||item.ContactPhone.indexOf($scope.search)>-1;
        }
        else{
            return item;
        }
    };
    //翻页
    $scope.changePager=function(){
        $scope.filter.PageNo=$scope.currentPage;
        $scope.getList();
    };
    //删除
    $scope.deleteappion=function(_code){
        layer.confirm('确认要删除吗？',function(index){
            if(index){
                ResourceService.getFunServer('appoindelete',{OrderCode:_code}).then(function(data){
                    if(data.status==1){
                        layer.msg('已删除!',{icon:1,time:1000},function(){
                            $scope.getList();
                        });
                    }else{
                        layer.msg('操作失败!',{icon:5,time:1000});
                    }
                })
            }
        });
    };
    //处理
    $scope.update=function(obj){
      var tpl=' <form class="form form-horizontal" >' +
          '<div class="row cl">'+
          '<label class="form-label col-3"><span class="c-red">*</span>状态：</label>'+
          '<div class="formControls col-8">'+
        '<a href="javascript:void(0)" class="order-flag active" data-value="0">未处理</a>'+
        '<a href="javascript:void(0)" class="order-flag" data-value="1">已预约</a>'+
        '<a href="javascript:void(0)" class="order-flag" data-value="2">已取消</a>'+
        '</div>'+
        '</div>' +
          '<div class="row cl">'+
          '<label class="form-label col-3"><span class="c-red">*</span>备注：</label>'+
          '<div class="formControls col-8">'+
          '<textarea class="textarea" id="Readme" value="'+obj.Readme+'"></textarea>'+
          '</div>'+
          '</div>' +
          '</form><div class="order-toolbar"><button class="btn btn-default" onclick="layer.closeAll()">取消</button><button class="btn btn-primary" id="saveOrderFlag">保存</button></div>';
        layer.open({
            title:"预约处理",
            type:1,
            skin: 'layui-layer-rim',
            content:tpl,
            area: ['400px', '250px']//宽高
        });
        $(".order-flag").on("click",function(){
            $(this).addClass("active").siblings().removeClass("active")
        });
        $("#saveOrderFlag").on("click",function(){
            var params={
                OrderCode:obj.OrderCode,
                OrderFlag:$(".order-flag.active").data("value"),
                Readme:$("#Readme").val()
            };
            if(!params.Readme){
                layer.msg("请填写备注信息");
                return false;
            }
            ResourceService.getFunServer("appoinupdate",params).then(function(data){
                if(data.status==1){
                    layer.msg('处理成功',{icon:1,time:1000},function(){
                        layer.closeAll();
                        $scope.getList();
                    });
                }else{
                    layer.msg("提交失败",{icon:5,time:1000});
                }
            })
        });

        var flag=parseInt(obj.OrderFlag) ;
        switch (flag){
            case 0:
                $(".order-flag").eq(0).addClass("active").siblings().removeClass("active");
                break;
            case 1:
                $(".order-flag").eq(1).addClass("active").siblings().removeClass("active");
                break;
            case 2:
                $(".order-flag").eq(2).addClass("active").siblings().removeClass("active");
                break;
        }
        if(obj.Readme){
            $("#Readme").val(obj.Readme);
        }


    }
}]).controller("UserController",["$rootScope","$scope",function(){

}]);