function login(_this){var key=$(".key").val();""!==key&&key?$.ajax({url:"/video_spider/login",type:"POST",dataType:"JSON",data:{key:key}}).done(function(result){result.flag?window.location.reload():alert(result.message)}).fail(function(){alert("服务器连接失败!")}).always(function(){console.log("complete")}):alert("密码不能为空!")}