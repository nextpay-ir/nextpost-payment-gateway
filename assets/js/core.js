$(function() {
    NextPost.General();
    NextPost.Skeleton();
    NextPost.ContextMenu();
    NextPost.Tooltip();
    NextPost.Forms();
    NextPost.FileManager();
    NextPost.LoadMore();

    NextPost.RemoveListItem();
    NextPost.AsideList();
});


/**
 * NextPost Namespace
 */
var NextPost = {};

    /**
     * General
     */
    NextPost.General = function()
    {
        // Mobile menu
        $(".topbar-mobile-menu-icon").on("click", function() {
            $("body").toggleClass('mobile-menu-open');
        });


        // Pop State
        window.onpopstate = function(e){
            if(e.state) {
                window.location.reload();
            }
        }
    }


    /**
     * Main skeleton
     */
    NextPost.Skeleton = function()
    {
        if ($(".skeleton--full").length > 0) {
            var $elems = $(".skeleton--full").find(".skeleton-aside, .skeleton-content");
            $(window).on("resize", function() {
                var h = $(window).height() - $("#topbar").outerHeight();
                $elems.height(h);
            }).trigger("resize");

            $(".skeleton--full").show();
        }
    }



    /**
     * Context Menu
     */
    NextPost.ContextMenu = function()
    {
        $("body").on("click", ".context-menu-wrapper", function(event){
            var menu = $(this).find(".context-menu");

            $(".context-menu").not(menu).removeClass('active');
            menu.toggleClass("active");
            event.stopPropagation();
        });

        $(window).on("click", function() {
            $(".context-menu.active").removeClass("active");
        });

        $("body").on("click", ".context-menu", function(event) {
            event.stopPropagation();
        })
    }

    /**
     * ToolTips
     */
    NextPost.Tooltip = function()
    {
        $(".tippy").each(function() {
            var dom = $(this)[0];

            if ($(this).hasClass("js-tooltip-ready")) {
                var tip = $(this).data("tip");
                var popper = tip.getPopperElement(dom);

                tip.update(popper);
            } else {
                var tip = Tippy(dom);
                $(this).addClass("js-tooltip-ready");
                $(this).data("tip", tip);
            }
        })

    }


    /**
     * General form functions
     */
    NextPost.Forms = function()
    {
        $("body").on("input focus", ":input", function() {
            $(this).removeClass("error");
        });

        $("body").on("change", ".fileinp", function(){
            if ($(this).val()) {
                var label = $(this).val().split('/').pop().split('\\').pop();
            } else {
                var label = $(this).data("label")
            }
            $(this).next("div").text(label).attr("title", label);
            $(this).removeClass('error');
        });

        NextPost.DatePicker();
        NextPost.Combobox();
        NextPost.AjaxForms();
    }


    /**
     * Combobox
     */
    NextPost.Combobox = function()
    {
        $("body").on("click", ".select2", function() {
            $(this).removeClass("error");
        });

        $(".combobox").select2({})
    }


    /**
     * Date time pickers
     */
    NextPost.DatePicker = function()
    {
        $(".js-datepicker").each(function() {
            $(this).removeClass("js-datepicker");

            if ($(this).data("min-date")) {
                $(this).data("min-date", new Date($(this).data("min-date")))
            }

            if ($(this).data("start-date")) {
                $(this).data("start-date", new Date($(this).data("start-date")))
            }

            $(this).datepicker({
                language: $("html").attr("lang"),
                dateFormat: "yyyy-mm-dd",
                timeFormat: "hh:ii",
                autoClose: true,
                timepicker: true,
                toggleSelected: false
            });
        })
    }


    /**
     * Add msg to the $resobj and displays it
     * and scrolls to $resobj
     * @param {$ DOM} $form jQuery ref to form
     * @param {string} type
     * @param {string} msg
     */
    var __form_result_timer = null;
    NextPost.DisplayFormResult = function($form, type, msg)
    {
        var $resobj = $form.find(".form-result");
        msg = msg || "";
        type = type || "error";

        if ($resobj.length != 1) {
            return false;
        }


        var $reshtml = "";
        switch (type) {
            case "error":
                $reshtml = "<div class='error'><span class='sli sli-close icon'></span> "+msg+"</div>";
                break;

            case "success":
                $reshtml = "<div class='success'><span class='sli sli-check icon'></span> "+msg+"</div>";
                break;

            case "info":
                $reshtml = "<div class='info'><span class='sli sli-info icon'></span> "+msg+"</div>";
                break;
        }

        $resobj.html($reshtml).stop(true).fadeIn();

        clearTimeout(__form_result_timer);
        __form_result_timer = setTimeout(function() {
            $resobj.stop(true).fadeOut();
        }, 10000);

        var $parent = $("html, body");
        var top =$resobj.offset().top - 85;
        if ($form.parents(".skeleton-content").length == 1) {
            $parent = $form.parents(".skeleton-content");
            top = $resobj.offset().top - $form.offset().top - 20;
        }

        $parent.animate({
            scrollTop: top + "px"
        });
    }


    /**
     * Ajax forms
     */
    NextPost.AjaxForms = function()
    {
        var $form;
        var $result;
        var result_timer = 0;

        $("body").on("submit", ".js-ajax-form", function(){
            $form = $(this);
            $result = $form.find(".form-result")
            submitable = true;

            $form.find(":input.js-required").each(function(){
                if (!$(this).val()) {
                    $(this).addClass("error");
                    submitable = false;
                }
            });

            if (submitable) {
                $("body").addClass("onprogress");

                $.ajax({
                    url: $form.attr("action"),
                    type: $form.attr("method"),
                    dataType: 'jsonp',
                    data: $form.serialize(),
                    error: function() {
                        $("body").removeClass("onprogress");
                        NextPost.DisplayFormResult($form, "error", __("Oops! An error occured. Please try again later!"));
                    },

                    success: function(resp) {
                        if (typeof resp.redirect === "string") {
                            window.location.href = resp.redirect;
                        } else if (typeof resp.msg === "string") {
                            var result = resp.result || 0;
                            var reset = resp.reset || 0;
                            switch (result) {
                                case 1: //
                                    NextPost.DisplayFormResult($form, "success", resp.msg);
                                    if (reset) {
                                        $form[0].reset();
                                    }
                                    break;

                                case 2: //
                                    NextPost.DisplayFormResult($form, "info", resp.msg);
                                    break;

                                default:
                                    NextPost.DisplayFormResult($form, "error", resp.msg);
                                    break;
                            }
                            $("body").removeClass("onprogress");
                        } else {
                            $("body").removeClass("onprogress");
                            NextPost.DisplayFormResult($form, "error", __("Oops! An error occured. Please try again later!"));
                        }
                    }
                });
            } else {
                NextPost.DisplayFormResult($form, "error", __("Fill required fields"));
            }

            return false;
        });
    }



    /**
     * Load More
     * @var window.loadmore Global object to hold callbacks etc.
     */
    window.loadmore = {}
    NextPost.LoadMore = function()
    {
        $("body").on("click", ".js-loadmore-btn", function(){
            var _this = $(this);
            var _parent = _this.parents(".loadmore");
            var id = _this.data("loadmore-id");

            if(!_parent.hasClass("onprogress")){
                _parent.addClass("onprogress");

                $.ajax({
                    url: _this.attr("href"),
                    dataType: 'html',
                    error: function(){
                        _parent.fadeOut(200);

                        if (typeof window.loadmore.error === "function") {
                            window.loadmore.error(); // Error callback
                        }
                    },
                    success: function(Response){
                        var resp = $(Response);
                        var $wrp = resp.find(".js-loadmore-content[data-loadmore-id='"+id+"']");

                        if($wrp.length > 0){
                            var wrp = $(".js-loadmore-content[data-loadmore-id='"+id+"']");
                            wrp.append($wrp.html());

                            if (typeof window.loadmore.success === "function") {
                                window.loadmore.success(); // Success callback
                            }
                        }

                        if(resp.find(".js-loadmore-btn[data-loadmore-id='"+id+"']").length == 1){
                            _this.attr("href", resp.find(".js-loadmore-btn[data-loadmore-id='"+id+"']").attr("href"));
                            _parent.removeClass('onprogress none');
                        }else{
                            _parent.hide();
                        }
                    }
                });
            }

            return false;
        });

        $(".js-loadmore-btn.js-autoloadmore-btn").trigger("click");
    }


    /**
     * Remove List Item (Data entry)
     *
     * Sends remove request to the backend
     * for selected list item (data entry)
     */
    NextPost.RemoveListItem = function()
    {
        $("body").on("click", "a.js-remove-list-item", function() {
            var item = $(this).parents(".js-list-item");
            var id = $(this).data("id");
            var url = $(this).data("url");

            NextPost.Confirm({
                confirm: function() {
                    $.ajax({
                        url: url,
                        type: 'POST',
                        dataType: 'jsonp',
                        data: {
                            action: "remove",
                            id: id
                        }
                    });

                    item.fadeOut(500, function() {
                        item.remove();
                    });
                }
            })
        });
    }


    /**
     * Actions related to aside list items
     */
    NextPost.AsideList = function()
    {
        // Load content for selected aside list item
        if ($(".skeleton-aside").length == 1) {
            $(".skeleton-aside").on("click", ".js-ajaxload-content", function() {
                var item = $(this).parents(".aside-list-item");
                var url = $(this).attr("href");

                if (!item.hasClass('active')) {
                    $(".aside-list-item").removeClass("active");
                    item.addClass("active");

                    $(".skeleton-aside").addClass('hide-on-medium-and-down');

                    $(".skeleton-content")
                    .addClass("onprogress")
                    .removeClass("hide-on-medium-and-down")
                    .load(url + " .skeleton-content>", function() {
                        $(".skeleton-content").removeClass('onprogress');
                    });


                    window.history.pushState({}, $("title").text(), url);
                }

                return false;
            })
        }
    }


    /**
     * File Manager
     */
    NextPost.FileManager = function()
    {
        var fmwrapper = $("#filemanager");
        if (fmwrapper.length != 1) {
            return false;
        }

        fmwrapper.oneFileManager({
            lang: $("html").attr("lang") || "en",
            onDoubleClick: function($file) {
                window.filemanager.selectFile($file);

                $(".filepicker").find(".js-submit").trigger("click")
            }
        });

        window.filemanager = fmwrapper.data("ofm");

        // Device file browser
        $("body").on("click", ".js-fm-filebrowser", function() {
            window.filemanager.browseDevice();
        });

        // URL Input form toggler
        $("body").on("click", ".js-fm-urlformtoggler", function() {
            window.filemanager.toggleUrlForm();
        });


        // Dropbox Chooser
        NextPost.DropboxChooser();

        // OneDrive Picker
        NextPost.OnedrivePicker();

        // Google Drive Picker
        //
        // Will be initialized automatically,
        // there is no need to call method here.

        // File Pickers (Browse buttons)
        NextPost.FilePickers();
    }


    /**
     * File Pickers (Browse buttons)
     */
    NextPost.FilePickers = function()
    {
        var acceptor;

        $("body").on("click", ".js-fm-filepicker", function() {
            acceptor = $(this).data("fm-acceptor");
            $(".filepicker").stop(true).fadeIn();
        });

        $(".filepicker").find(".js-close").on("click", function() {
            $(".filepicker").stop(true).fadeOut();
        });

        $(".filepicker").find(".js-submit").on("click", function() {
            if (acceptor) {
                var selection = window.filemanager.getSelection();
                var file = selection[Object.keys(selection)[0]];
                $(acceptor).val(file.url);
            }
            $(".filepicker").stop(true).fadeOut();
        })
    }


    /**
     * Dropbox Chooser
     */
    NextPost.DropboxChooser = function(settings)
    {
        $("body").on("click", "a.cloud-picker[data-service='dropbox']", function() {
            var _this = $(this);

            Dropbox.choose({
                linkType: "direct",
                multiselect: true,
                extensions: ['.jpg', '.jpeg', ".png", '.mp4'],
                success: function(files) {
                    for (var i = 0; i < files.length; i++) {
                        if (i >= 10) {
                            break;
                        }

                        if (!files[i].isDir) {
                            window.filemanager.upload(files[i].link);
                        }
                    }
                },
            })
        })
    }


    /**
     * Onedrive Picker
     */
    NextPost.OnedrivePicker = function(settings)
    {
        $("body").on("click", "a.cloud-picker[data-service='onedrive']", function() {
            var _this = $(this);

            OneDrive.open({
                clientId: _this.data("client-id"),
                action: "download",
                multiSelect: true,
                openInNewWindow: true,
                advanced: {
                    filter: '.jpeg,.jpg,.png,.mp4'
                },
                success: function(files) {
                    for (var i = 0; i < files.value.length; i++) {
                        if (i >= 10) {
                            break;
                        }

                        window.filemanager.upload(files.value[i]["@microsoft.graph.downloadUrl"]);
                    }
                }
            });
        })
    }


    /**
     * Google Drive Picker
     */
    GoogleDrivePickerInitializer = function()
    {
        if ($("a.cloud-picker[data-service='google-drive']").length == 1) {
            var _this = $("a.cloud-picker[data-service='google-drive']");

            var picker = new GoogleDrivePicker({
                apiKey: _this.data("api-key"),
                clientId: _this.data("client-id").split(".")[0],
                buttonEl: _this[0],
                onSelect: function(file) {
                    window.filemanager.upload("https://www.googleapis.com/drive/v3/files/?id="+file.id+"&token="+gapi.auth.getToken().access_token+"&ext="+file.fileExtension+"&size="+file.size);
                }
            });
        }
    }


    /**
     * Confirm
     */
    NextPost.Confirm = function(data = {})
    {
        data = $.extend({}, {
            title: __("Are you sure?"),
            content: __("It is not possible to get back removed data!"),
            confirmText: __("Yes, Delete"),
            cancelText: __("Cancel"),
            confirm: function() {},
            cancel: function() {},
        }, data);


        $.confirm({
            title: data.title,
            content: data.content,
            theme: 'supervan',
            animation: 'opacity',
            closeAnimation: 'opacity',
            buttons: {
                confirm: {
                    text: data.confirmText,
                    btnClass: "small button button--danger mr-5",
                    keys: ['enter'],
                    action: typeof data.confirm === 'function' ? data.confirm : function(){}
                },
                cancel: {
                    text: data.cancelText,
                    btnClass: "small button button--simple",
                    keys: ['esc'],
                    action: typeof data.cancel === 'function' ? data.cancel : function(){}
                },
            }
        });
    }


    /**
     * Alert
     */
    NextPost.Alert = function(data = {})
    {
        data = $.extend({}, {
            title: __("Error"),
            content: __("Oops! An error occured. Please try again later!"),
            confirmText: __("Close"),
            confirm: function() {},
        }, data);

        $.alert({
            title: data.title,
            content: data.content,
            theme: 'supervan',
            animation: 'opacity',
            closeAnimation: 'opacity',
            buttons: {
                confirm: {
                    text: data.confirmText,
                    btnClass: "small button button--dark",
                    keys: ['enter'],
                    action: typeof data.confirm === 'function' ? data.confirm : function(){}
                },
            }
        });
    }







    /**
     * Captions
     */
    NextPost.Captions = function()
    {
        var wrapper = $("#captions");

        var _linky = function()
        {
            wrapper.find(".box-list-item p").not(".js-linky-done")
                   .addClass("js-linky-done")
                   .linky({
                        mentions: true,
                        hashtags: true,
                        urls: false,
                        linkTo:"instagram"
                    });
        }

        // Linky captions
        _linky();
        window.loadmore.success = function($item)
        {
            _linky();
        }
    }

    /**
     * Caption
     */
    NextPost.Caption = function()
    {
        var $form = $("#caption form");

        // Emoji
        var emoji = $(".caption-input").emojioneArea({
            saveEmojisAs      : "shortname", // unicode | shortname | image
            imageType         : "svg", // Default image type used by internal CDN
            pickerPosition: 'bottom',
            buttonTitle: __("Use the TAB key to insert emoji faster")
        });

        // Caption input filter
        emoji[0].emojioneArea.on("drop", function(obj, event) {
            event.preventDefault();
        });

        emoji[0].emojioneArea.on("paste keyup input emojibtn.click", function() {
            $form.find(":input[name='caption']").val(emoji[0].emojioneArea.getText());
        });
    }



    /**
     * Package Form
     */
    NextPost.PackageForm = function()
    {
        $("body").on("click", ".js-save-and-update", function() {
            var form = $(this).parents("form");

            form.find(":input[name='update-subscribers']").val(1);
            form.trigger("submit");
            form.find(":input[name='update-subscribers']").val(0);
        });
    }


    /**
     * User Form
     */
    NextPost.UserForm = function()
    {
        $("body").on("change", ":input[name='package-subscription']", function() {
            if ($(this).is(":checked")) {
                $(".package-options").find(":input").prop("disabled", true);
                $(".package-options").css("opacity", ".35");
            } else {
                $(".package-options").find(":input").prop("disabled", false);
                $(".package-options").css("opacity", "");
            }
        });

        $("body").on("change", ":input[name='package']", function() {
            if ($(this).val() < 0) {
                $(":input[name='package-subscription']").prop({
                    "checked": false,
                    "disabled": true
                });
            } else {
                $(":input[name='package-subscription']").prop("disabled", false);
            }

            $(":input[name='package-subscription']").trigger("change");
        });

        $(":input[name='package-subscription']").trigger("change");

        $(document).ajaxComplete(function(event, xhr, settings) {
            var rx = new RegExp("(users\/[0-9]+(\/)?)$");
            if (rx.test(settings.url)) {
                NextPost.DatePicker();
                $(":input[name='package-subscription']").trigger("change");
            }
        })
    }



    /**
     * Scheduled Posts (Day)
     */
    NextPost.ScheduledPostsDay = function()
    {
        var $wrp = $("#schedule-calendar-day");

        $wrp.find("video").each(function(index, el) {
            var _this = $(this);
            _this.on("loadedmetadata", function() {
                if (this.videoWidth >= this.videoHeight) {
                    _this.css({
                        "height" : "100%",
                        "width" : "auto"
                    });
                } else {
                    _this.css({
                        "width" : "100%",
                        "height" : "auto"
                    });
                }
            });
        });

        $wrp.find(":input[name='account']").on("change", function() {
            $(this).parents("form").trigger("submit");
        })
    }


    /**
     * Settings
     */
    NextPost.Settings = function()
    {
        $(".js-settings-menu").on("click", function() {
            $(".asidenav").toggleClass("mobile-visible");
            $(this).toggleClass("mdi-menu-down mdi-menu-up");

            $("html, body").delay(200).animate({
                scrollTop: "0px"
            });
        });


        // Proxy form
        if ($("#proxy-form").length == 1) {
            $("#proxy-form :input[name='enable-proxy']").on("change", function() {
                $("#proxy-form :input[name='enable-user-proxy']").prop("disabled", !$(this).is(":checked"));

                if ($("#proxy-form :input[name='enable-user-proxy']").is(":disabled")) {
                    $("#proxy-form :input[name='enable-user-proxy']").prop("checked", false);
                }
            }).trigger("change");
        }

        if ($("#smtp-form").length == 1) {
            $("#smtp-form :input[name='auth']").on("change", function() {
                if ($(this).is(":checked")) {
                    $("#smtp-form :input[name='username'], :input[name='password']")
                    .prop("disabled", false);
                } else {
                    $("#smtp-form :input[name='username'], :input[name='password']")
                    .prop("disabled", true)
                    .val("");
                }
            }).trigger("change");
        }

        if ($("#stripe-form").length == 1) {
            $("#stripe-form :input[name='recurring']").on("change", function() {
                if ($(this).is(":checked")) {
                    $("#stripe-form :input[name='webhook-key']")
                    .prop("disabled", false);

                    $("#stripe-form :input[name='webhook-key']").parent().css("opacity", 1);
                } else {
                    $("#stripe-form :input[name='webhook-key']")
                    .prop("disabled", true);

                    $("#stripe-form :input[name='webhook-key']").parent().css("opacity", 0.2);
                }
            }).trigger("change");
        }
    }


    /**
     * Statistics
     */
    NextPost.Statistics = function()
    {
        var $page = $("#statistics");
        var $form = $page.find("form");

        $form.find(":input[name='account']").on("change", function() {
            $form.trigger("submit");
        });


        // Get account summary
        var $account_summary = $page.find(".account-summary");

        $.ajax({
            url: $account_summary.data("url"),
            type: 'POST',
            dataType: 'jsonp',
            data: {
                action: "account-summary"
            },

            error: function() {
                $account_summary.find(".numbers").html("<div class='error'>"+__("Oops! An error occured. Please try again later!")+"</div>");
                $account_summary.removeClass('onprogress');
            },

            success: function(resp) {
                if (resp.result == 1) {
                    var $temp = $("<div class='statistics-numeric'></div>");
                        $temp.append("<span class='number'></span>");
                        $temp.append("<span class='label'></span>");

                    var $media_count = $temp.clone();
                        $media_count.find(".number").text(resp.data.media_count)
                        $media_count.find(".label").text(__("Total Posts"));
                        $media_count.appendTo($account_summary.find(".numbers"));

                    var $followers = $temp.clone();
                        $followers.find(".number").text(resp.data.follower_count)
                        $followers.find(".label").text(__("Followers"));
                        $followers.appendTo($account_summary.find(".numbers"));

                    var $following = $temp.clone();
                        $following.find(".number").text(resp.data.following_count)
                        $following.find(".label").text(__("Following"));
                        $following.appendTo($account_summary.find(".numbers"));
                } else {
                    $account_summary.find(".numbers").html("<div class='error'>"+resp.msg+"</div>");
                }

                $account_summary.removeClass('onprogress');
            }
        });



        $("canvas").each(function() {
            $(this).width($(this).width());
            $(this).height($(this).height());

            $(this).parents(".chart-container").css("height", "auto");
            $(this).css("position", "relative")
        });
    }



    /**
     * Renew
     */
    NextPost.Renew = function()
    {
        var $form = $(".payment-form");
        if ($form.length == 1) {
            if ($form.find(":input[name='payment-gateway']").length > 0) {
                $form.find(".payment-gateways, .payment-cycle").removeClass("none");
                $form.find(":input[name='payment-gateway']").eq(0).prop("checked", true);
            }


            $form.find(":input[name='payment-gateway']").on("change", function() {
                if (!$form.find(":input[name='payment-gateway']:checked").data("recurring")) {
                    $form.find(":input[name='payment-cycle'][value='recurring']").parents(".option-group-item").addClass('none');
                } else {
                    $form.find(":input[name='payment-cycle'][value='recurring']").parents(".option-group-item").removeClass('none');
                }

                if ($form.find(":input[name='payment-cycle']:checked").parents(".option-group-item").hasClass('none')) {
                    $form.find(":input[name='payment-cycle']").eq(0).prop("checked", true);
                }
            });
            $form.find(":input[name='payment-gateway']").eq(0).trigger("change");


            // Initialize Stripe
            var data = {};

            if ($form.find(":input[name='payment-gateway'][value='stripe']").length == 1) {
                var stripe = StripeCheckout.configure({
                    key: $form.data("stripe-key"),
                    image: $form.data("stripe-img"),
                    email: $form.data("email"),
                    locale: $("html").attr("lang"),
                    token: function(token) {
                        data.token = token.id;
                        _placeOrder();
                    }
                });

                window.addEventListener('popstate', function() {
                    stripe.close();
                });
            }

            $form.on("submit", function() {
                data.plan = $form.find(":input[name='plan']:checked").val();
                data.payment_gateway = $form.find(":input[name='payment-gateway']:checked").val();
                data.payment_cycle = $form.find(":input[name='payment-cycle']:checked").val();

                if (data.payment_gateway == "nextpay") {
                    _placeOrder();
                } else if (data.payment_gateway == "stripe") {
                    stripe.open({
                        name: $form.data("site"),
                        description: $form.find(":input[name='plan']:checked").data("desc"),
                        amount: $form.find(":input[name='plan']:checked").data("amount"),
                        currency: $form.data("currency")
                    });
                }
            })
        }


        var _placeOrder = function()
        {
            data.action = "pay";

            $("body").addClass("onprogress");
            $.ajax({
                url: $form.data("url"),
                type: 'POST',
                dataType: 'jsonp',
                data: data,
                error: function(){
                    NextPost.Alert();
                    $("body").removeClass("onprogress");
                },

                success: function(resp) {
                    if (resp.result == 1) {
                        window.location.href = resp.url;
                    } else {
                        NextPost.Alert({
                            content: resp.msg
                        });

                        $("body").removeClass("onprogress");
                    }
                }
            });
        }
    }


    /**
     * Expired
     */
    NextPost.CancelRecurringPayments = function()
    {
        $(".js-cancel-recurring-payments").on("click", function() {
            var $this = $(this);

            NextPost.Confirm({
                title: __("Are you sure?"),
                content: __("Do you really want to cancel automatic payments?"),
                confirmText: __("Yes, cancel automatic payments"),
                cancelText: __("No"),
                confirm: function() {
                    $("body").addClass("onprogress");

                    $.ajax({
                        url: $this.data("url"),
                        type: 'POST',
                        dataType: 'jsonp',
                        data: {
                            "action": "cancel-recurring"
                        },
                        error: function(){
                            NextPost.Alert();
                            $("body").removeClass("onprogress");
                        },

                        success: function(resp) {
                            if (resp.result == 1) {
                                window.location.reload();
                            } else {
                                NextPost.Alert({
                                    content: resp.msg
                                });

                                $("body").removeClass("onprogress");
                            }
                        }
                    });
                }
            });
        });
    }


    /**
     * Plugins
     */
    NextPost.Plugins = function()
    {
        $("body").on("click", "a.js-deactivate, a.js-activate", function() {
            var $item = $(this).parents("tr")
            var id = $(this).data("id");
            var url = $(this).data("url");
            var action = $(this).hasClass('js-deactivate') ? "deactivate" : "activate";

            $("body").addClass("onprogress");

            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'jsonp',
                data: {
                    action: action,
                    id: id
                },

                error: function() {
                    NextPost.Alert();
                    $("body").removeClass("onprogress");
                },

                success: function(resp) {
                    if (resp.result == 1) {
                        $item.find("a.js-deactivate, a.js-activate").toggleClass("none");
                    } else {
                        NextPost.Alert({
                            content: resp.msg
                        });
                    }
                    $("body").removeClass("onprogress");
                }
            });
        });
    }



    /**
     * Upload new plugin
     */
    NextPost.Plugin = function()
    {
        var $page = $("#plugin");
        var $form = $page.find("form");

        $form.on("submit", function() {
            var submitable = true;

            if (!$form.find(":input[name='file']").val()) {
                $form.find(":input[name='file']").addClass("error");
                submitable = false;
            }

            if (submitable && $form.find(":input[name='file']")[0].files.length > 0) {
                $("body").addClass("onprogress");

                var data = new FormData();
                    data.append("action", "upload");
                    data.append("file", $form.find(":input[name='file']")[0].files[0]);

                $.ajax({
                    url: $form.attr("action"),
                    type: "POST",
                    dataType: 'jsonp',
                    data: data,
                    cache: false,
                    contentType: false,
                    processData: false,

                    error: function() {
                        $("body").removeClass("onprogress");
                        NextPost.DisplayFormResult($form, "error", __("Oops! An error occured. Please try again later!"));
                    },

                    success: function(resp) {
                        if (resp.result == 1) {
                            window.location.href = resp.redirect;
                        } else {
                            NextPost.DisplayFormResult($form, "error", resp.msg);
                            $("body").removeClass("onprogress");
                        }

                    }
                });
            }

            return false;
        })
    }


/* Functions */

/**
 * Validate Email
 */
function isValidEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

/**
 * Get scrollbar width
 */
function scrollbarWidth(){
    var scrollDiv = document.createElement("div");
    scrollDiv.className = "scrollbar-measure";
    document.body.appendChild(scrollDiv);
    var w = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);

    return w;
}


/**
 * Validate URL
 */
function isValidUrl(url) {
    return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}
