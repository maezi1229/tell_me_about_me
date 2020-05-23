$(function(){
  function buildHTML(message){
    if ( message.image ) {
      var html =
       `<div class="wrapper__main_chat__message-list__box">
          <div class="wrapper__main_chat__message-list__box__a">
            <div class="info1">
              ${message.user_name}
            </div>
            <div class="info2">
              ${message.created_at}
            </div>
          </div>
          <div class="wrapper__main_chat__message-list__box__b">
            <p class="lower-message__content">
              ${message.content}
            </p>
          </div>
          <img src=${message.image} >
        </div>`
      return html;
    } else {
      var html =
       `<div class="wrapper__main_chat__message-list__box">
          <div class="wrapper__main_chat__message-list__box__a">
            <div class="info1">
              ${message.user_name}
            </div>
            <div class="info2">
              ${message.created_at}
            </div>
          </div>
          <div class="wrapper__main_chat__message-list__box__b">
            <p class="lower-message__content">
              ${message.content}
            </p>
          </div>
        </div>`
      return html;
    };
  }

$('#new_message').on('submit', function(e){
  e.preventDefault();
  var formData = new FormData(this);
  var url = $(this).attr('action');
  
  $.ajax({
    url: url,
    type: "POST",
    data: formData,
    dataType: 'json',
    processData: false,
    contentType: false
  })
    .done(function(data){
      var html = buildHTML(data);
      $('.wrapper__main_chat__message-list').append(html);
      $('#new_message')[0].reset();
      $('.wrapper__main_chat__message-list').animate({ scrollTop: $('.wrapper__main_chat__message-list')[0].scrollHeight});
      $('.submit-btn').prop('disabled', false);
    })
    .fail(function() {
      alert("メッセージ送信に失敗しました");
    });
});
});



