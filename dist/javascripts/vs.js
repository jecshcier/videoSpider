var lineNum=0;function share(_this){var videoClass=$(_this).attr("rel"),videoData={name:$(_this).attr("videoName"),data:[]};console.log(videoClass),$("."+videoClass+">li").each(function(index,el){videoData.data.push({num:$(el).find("a").html(),url:$(el).find("a").attr("href")})}),$.ajax({url:"/video_spider/gen_video",type:"POST",dataType:"json",data:{data:JSON.stringify(videoData)}}).done(function(data){$("."+videoClass).after("<p>分享成功！分享链接为:"+data.url+"</p>")}).fail(function(){alert("服务器连接失败!")}).always(function(){console.log("complete")})}function startSearch(_this){if($(_this).addClass("searching"),$(_this).html("搜索中"),!$("#videoName").val().replace(/ /g,"").length)return alert("请输入视频名称！"),$(_this).removeClass("searching"),void $(_this).html("搜索");$.ajax({url:"/video_spider/searchVideo",type:"POST",dataType:"json",data:{videoName:$("#videoName").val()}}).done(function(result){if(console.log(result),$(_this).removeClass("searching"),$(_this).html("搜索"),result.flag){var videoData=result.data;if($(".video-list").empty(),!result.data.length)return void $(".video-list").append('<p style="font-size:18px;color:red;">暂无此视频，我们后续会更新收录哦！</p>');for(var i=0;i<videoData.length;i++){$(".video-list").append("<h2>"+videoData[i].name+'</h2><img width="200" height="300" src="'+videoData[i].thumb+'">');for(var j=0;j<videoData[i].list.length;j++){$(".video-list").append("<h3>列表"+j+"</h3>"),$(".video-list").append('<ul class="list type_'+i+"_list_"+j+'">');for(var k=0;k<videoData[i].list[j].length;k++){var vi=videoData[i].list[j],viUrl=vi[k].url;$(".type_"+i+"_list_"+j).append('<li><a target="_blank" href="'+apiUrl+"?line="+lineNum+"&key="+viUrl+"&v="+verifyKey+'" url="'+viUrl+'">'+vi[k].num+"</a></li>")}$(".video-list").append("</ul>"),$(".video-list").append('<button rel="type_'+i+"_list_"+j+'" class="share" onclick="share(this)" videoName="'+videoData[i].name+'">一键分享</button>')}}}else alert(result.message)}).fail(function(){$(_this).removeClass("searching"),$(_this).html("搜索"),alert("服务器连接失败")}).always(function(){console.log("complete")})}$("input[name=changeLine]").change(function(event){lineNum=parseInt($(this).attr("url")),$(".list>li>a").length&&(alert("切换线路中，请稍后!"),$(".list>li>a").each(function(index,el){var url=$(this).attr("url");$(this).attr("href",apiUrl+"?line="+(lineNum-1)+"&key="+url+"&v="+verifyKey)}),alert("线路切换完成！播放视频试试吧！"))});