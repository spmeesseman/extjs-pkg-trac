
Ext.define('Ext.ux.trac.TicketDetail', 
{
    extend: 'Ext.panel.Panel',
    xtype: 'ticketdetail',
    
    flex:1,
    border:false,
    bodyPadding: '10 10 10 10',
    cls: 'trac-ticket-list-ticket-detail',
    iconCls: 'far fa-ticket-alt',

    viewModel: 
    {
        data: {
            record: null
        }
    },

    layout: 
    {
        type: 'vbox',
        align : 'stretch',
        pack  : 'start'
    },
    
    items: [
    {
        layout:
        {
            type: 'hbox',
            align: 'stretch',
            pack  : 'start'
        },
        bodyStyle: 
        {
            background: 'transparent'
        },
        items: [
        {
            flex: 1,
            cls: 'trac-ticket-list-ticket-id trac-text-shadow-letterpress',
            bind: 
            {
                html: 'Ticket #{record.id}'
            }
        },
        {
            margin: '0 5 0 0',
            items: [
            {
                bind: 
                {
                    html: '{record.type}',
                    bodyStyle: 
                    {
                        'color': 'white',
                        'background': '{typeColor}',
                        'text-align':'right',
                        'border-radius': '5px'
                    }
                },
                bodyPadding: '3 5 3 5'
            }]
        },
        {
            margin: '0 10 0 0',
            items: [
            {
                bind: 
                {
                    html: '{record.status}',
                    bodyStyle: 
                    {
                        'color': 'white',
                        'background': '{statusColor}',
                        'text-align':'right',
                        'border-radius': '5px'
                    }
                },
                bodyPadding: '3 5 3 5'
            }]
        }]
    },
    {
        cls: 'trac-ticket-list-ticket-summary trac-text-shadow-letterpress',
        bind: 
        {
            html: '{record.summary}'
        }
    },
    {
        flex: 1,
        cls: 'trac-ticket-list-ticket-description',
        margin: '10 0 0 0',
        bind: 
        {
            html: '{record.description}'
        }
    }]

});
