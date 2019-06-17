Ext.define('Ext.ux.trac.Trac', 
{
    singleton: true,
    alias: 'Trac',
    alternateClassName: 'Trac',

    require: [ 'Ext.util.Cookies' ],

    user: 'smeesseman',
    password: '',
    repository: null,
    logger: null,

    privates:
    {
        _authenticated: false
    },


    authenticate: function(request) 
    {
        var me = this;
        var deferred = new Ext.Deferred();

        if (!me._authenticated)
        {
            var matches = document.cookie.match(/trac_auth="(.*)"/);
            if (matches && matches.length > 0) {
                console.log("COOKIE EXISTS");
                return Ext.Deferred.resolved(true);
            }

            Ext.Ajax.request(
            {
                scope: this,
                url: 'https://app1.development.pjats.com/projects/gems2/login',
                withCredentials: true,
                useDefaultXhrHeader: false,
                success: function(response, options)
                {               
                    matches = response.responseText.match(/name="__FORM_TOKEN" value="(.*)" /);
                    if (matches.length === 2) 
                    {
                        Ext.Ajax.request(
                        {
                            scope: this,
                            url: 'https://app1.development.pjats.com/projects/gems2/login',
                            method: 'POST',
                            withCredentials: true,
                            useDefaultXhrHeader: false,
                            params:
                            {
                                __FORM_TOKEN: matches[1],
                                username: Trac.user,
                                password: Trac.password,
                                submit: 'Login'
                            },
                            success: function(response2, options2)
                            {               
                                deferred.resolve(true);
                            },
                            failure: function(response2, options2)
                            {
                                deferred.reject('Authentication failed (POST)');
                            }
                        });
                    }
                    else {
                        deferred.reject('Authentication failed (GET1)');
                    }
                },
                failure: function(response, options)
                {
                    //
                    // Failed to retrieve the Login page
                    //
                    // This is probably because a session already exists, we can resolve()
                    //
                    // Note that a CORS error is thrown here as requesting the login page redirects to
                    // '/', with an origin of 'null' in the response header (have not looked into)
                    // Seems it is safe to ignore, for correct operation
                    //
                    //deferred.reject('Authentication failed (GET0)');
                    deferred.resolve(true);
                }
            });
        }
        else {
            return Ext.Deferred.resolved(true);
        }

        return deferred.promise;
    },

    
    createIssue: function()
    {
        var me = this;

        if (!me.repository) {
            if (me.logger) {
                me.logger.error("Invalid repository");
            }
            return;
        }
    },

    createRelease: function(tag)
    {
        var me = this;

        if (!me.repository) {
            if (me.logger) {
                me.logger.error("Invalid repository");
            }
            return;
        }
    },

    
    parseTracRpcRsp: function(response)
    {
        var json;
        try {
            if (response.responseText) {
                json = Ext.util.JSON.decode(response.responseText);
            }
            else if (response) {
                json = Ext.util.JSON.decode(response);
            }
        } 
        catch(e) {
            Utils.alertError("An error occurred executing the Trac RPC - Could not decode response");
            return [];
        }
        //
        // Read the JSON result
        //
        if (!json) {
            Utils.alertError("An error occurred executing the Trac RPC");                          
            return [];
        }
        //
        // Make sure the server returned success
        //
        if (json.error) {
            Utils.alertError("An error occurred executing the Trac RPC.<br><br>Code:   " + json.error.code +
                                "<br>Name:    " + json.error.name + "<br>Message: " + json.error.message);                          
            return [];
        }
        if (!json.result) {
            Utils.alertError("An error occurred executing the Trac RPC - Invalid result");                          
            return [];
        }
        if (!json.hasOwnProperty("id")) {
            Utils.alertError("An error occurred executing the Trac RPC - Invalid id");                          
            return [];
        }

        return json.result;
    },


    getTickets: function()
    {
        var me = this;
        var deferred = new Ext.Deferred();

        me.authenticate().then((token) => {
        Ext.Ajax.request(
        {
            scope: this,
            url: 'https://app1.development.pjats.com/projects/gems2/login/rpc',
            method: 'POST',
            withCredentials: true,
            userName: Trac.user,
            password: Trac.password,
            useDefaultXhrHeader: false,
            headers:
            {
                Authorization: 'Basic ' + btoa(Trac.user + ':' + Trac.password)
            },
            jsonData:
            {
                params: [ "status!=closed" ],
                method: "ticket.query",
                max: 0,
                page: 1
            },
            success: function(response, options)
            {               
                var ticketIds = me.parseTracRpcRsp(response);
                if (ticketIds.length > 0)
                {
                    var tId = 0;
                    var tickets = [];
                    function _getTicket(id)
                    {
                        me.getTicket(id).then((ticket) =>
                        {
                            if (tId < ticketIds.length - 1) 
                            {
                                tickets.push(ticket);
                                _getTicket(ticketIds[++tId]);
                            }
                            else {
                                deferred.resolve(tickets);
                            }
                        },
                        (e) => { deferred.reject(e); });
                    }
                    _getTicket(ticketIds[tId]);
                }
            },
            failure: function(response, options)
            {
                deferred.reject('Could not execute Trac RPC');
            }
        }); }, (e) => { deferred.reject(e); });

        return deferred.promise;
    },


    getTicket: function(id)
    {
        var me = this;
        var deferred = new Ext.Deferred();

        Ext.Ajax.request(
        {
            scope: this,
            url: 'https://app1.development.pjats.com/projects/gems2/login/rpc',
            method: 'POST',
            withCredentials: true,
            userName: Trac.user,
            password: Trac.password,
            useDefaultXhrHeader: false,
            headers:
            {
                Authorization: 'Basic ' + btoa(Trac.user + ':' + Trac.password)
            },
            jsonData:
            {
                params: [ id ],
                method: "ticket.get"
            },
            success: function(response, options2)
            {
                var tracTicket = me.parseTracRpcRsp(response);
                //
                // Trac Ticket response = 4 part array
                //
                //     [0] : id
                //     [1] : date
                //     [2] : date
                //     [3] : ticketinfo
                //
                var ticket = GEMS.model.trac.Ticket.createWithId(id,
                {
                    cc: tracTicket[3].cc,
                    component: tracTicket[3].component,
                    description: tracTicket[3].description,
                    keywords: tracTicket[3].keywords,
                    milestone: tracTicket[3].milestone,
                    owner: tracTicket[3].owner,
                    priority: tracTicket[3].priority,
                    reporter: tracTicket[3].reporter,
                    resolution: tracTicket[3].resolution,
                    status: tracTicket[3].status,
                    summary: tracTicket[3].summary,
                    ticketsboard: tracTicket[3].ticketsboard,
                    type: tracTicket[3].type,
                    version: tracTicket[3].version,
                    _ts: tracTicket[3]._ts,
                    changetime: new Date(tracTicket[3].changetime.__jsonclass__[1]),
                    due_date: new Date(tracTicket[3].due_date.__jsonclass__[1]),
                    time: new Date(tracTicket[3].time.__jsonclass__[1])
                });

                deferred.resolve(ticket);

            },
            failure: function(response, options)
            {
                deferred.reject('Could not execute Trac RPC');
            }
        });

        return deferred.promise;
    }
});
