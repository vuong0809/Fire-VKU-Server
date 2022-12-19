import React from 'react';
import {
    useStore,
    Page,
    Navbar,
    Card,
    List,
    ListItem,
    Button
} from "zmp-framework/react";
import store from '../store';

var colors = ['#007bff', '#28a745', '#333333', '#c3e6cb', '#dc3545', '#6c757d'];

// import io from 'socket.io-client';
// const socket = io('http://localhost:8000');
// socket.on('connect', () => {
//     console.log(socket.id);
//     socket.on('results', (msg) => {
//         console.log(msg);
//     });
//     socket.on('sensor', (msg) => {
//         console.log(msg);
//     });
// });



const HomePage = () => {
    var chDonutData1 = {
        labels: ['Bootstrap', 'Popper', 'Other'],
        datasets: [
            {
                backgroundColor: colors.slice(0, 3),
                borderWidth: 0,
                data: [74, 11, 40]
            }
        ]
    };
    return (
        <Page name='home'>
            <div className="card">
                    <div className="card-body">
                    <img src="https://freetuts.net/upload/product_series/images/2019/04/13/107/macbook-thieu-driver.jpg" width={343} alt="Cinque Terre" />
                    </div>
                </div>
            <div className='row'>
                <div className='col'>
                    <p>Temp</p>
                    <span>26</span>
                </div>
                <div className='col'>
                    <p>Humi</p>
                    <span>26</span>
                </div>
                <div className='col'>
                    <p>Surface</p>
                    <span>26</span>
                </div>
                <div className='col'>
                    <p>Moisture</p>
                    <span>26</span>
                </div>
                <div className='col'>
                    <p>Smoke</p>
                    <span>26</span>
                </div>
            </div>
            <div className="col-md-4 py-1">
                <div className="card">
                    <div className="card-body">
                    <img src="https://i.stack.imgur.com/WWQJL.png" width={343} alt="Cinque Terre" />
                    </div>
                </div>
            </div>
        </Page>
    );
};
export default HomePage;