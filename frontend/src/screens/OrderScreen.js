import axios from 'axios';
import { PayPalButton } from 'react-paypal-button-v2';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Divider, Icon, Message, Table } from 'semantic-ui-react';
import OrderItems from '../components/OrderItems';
import { getOrderDetails, updateOrderToPaid } from '../actions/orderActions';
import Page404 from '../components/Page404';
import Loader from '../components/Loader';
import { ORDER_PAY_RESET } from '../constants/orderConstants';

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id;
  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [sdkLoaded, setSdkLoaded] = useState(false);

  const orderDetails = useSelector((state) => state.orderDetails);
  const { loading, order, error } = orderDetails;

  const orderPay = useSelector((state) => state.orderPay);
  const { loading: payLoading, success: paySuccess } = orderPay;

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }

    const addPayPalScript = async () => {
      const { data: clientId } = await axios.get('/api/config/paypal');
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
      script.async = true;
      script.onload = () => {
        setSdkLoaded(true);
      };
      document.body.appendChild(script);
    };

    if (!order || paySuccess || order._id !== orderId) {
      dispatch({ type: ORDER_PAY_RESET });
      dispatch(getOrderDetails(orderId));
    } else if (!order.isPaid) {
      if (!window.isPaid) {
        addPayPalScript();
      } else {
        setSdkLoaded(true);
      }
    }
  }, [dispatch, orderId, userInfo, history, order, paySuccess]);

  const priceFormat = (price) => {
    return (Math.round(price * 100) / 100).toFixed(2);
  };

  if (!loading) {
    order.itemsPrice = priceFormat(order.itemsPrice);
    order.shippingCost = priceFormat(order.shippingCost);
    order.taxPrice = priceFormat(order.taxPrice);
    order.orderTotal = priceFormat(order.orderTotal);
    order.createdAt = order.createdAt.split('T')[0];
  }
  const successPaymentHandler = (paymentResult) => {
    console.log(paymentResult);

    dispatch(updateOrderToPaid(orderId, paymentResult));
  };

  return loading ? (
    <Loader />
  ) : error ? (
    <Page404 />
  ) : (
    <div className='order-container'>
      <div className='order-details'>
        <h2>
          Thank you! <br />
          Your order has been placed.
        </h2>
        <h4>Order Information</h4>
        <div>{`Order #: ${order._id}`}</div>
        <div>{`Order placed on: ${order.createdAt}`}</div>
        <h4>Shipping Information</h4>
        <div>Shipping Address:</div>
        <div>{order.user.name},</div>
        <div>{`${order.shippingAddress.address}, ${order.shippingAddress.city} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}.`}</div>
        <div>
          {order.isDelivered ? (
            <Message success style={style}>
              <span>Shipping status: </span>
              <span style={{ fontWeight: '400' }}> Delivered</span>
            </Message>
          ) : (
            <Message style={style} error>
              <span>Shipping status: </span>
              <span style={{ fontWeight: '400' }}>Not Delivered</span>
            </Message>
          )}
        </div>

        <h4>Payment Information</h4>
        <div>
          Payment method: <Icon className='paypal card' size='large' />
          {order.paymentMethod}
        </div>
        <div>
          {order.isPaid ? (
            <Message style={style} success>
              <span>Payment status: </span>
              <span style={{ fontWeight: '400' }}>Paid</span>
            </Message>
          ) : (
            <Message style={style} error>
              <span>Payment status: </span>
              <span style={{ fontWeight: '400' }}>Not Paid</span>
            </Message>
          )}
        </div>

        <Divider style={{ borderTop: '1px solid rgba(91, 14, 22, 0.1)' }} />

        <h2>Order Items</h2>
        {order.orderItems.map((e) => (
          <OrderItems key={e.product} items={e} />
        ))}
      </div>
      <div className='order-summary'>
        <h2>Order Summary</h2>
        <div className='order-summary__amount'>
          <Table basic='very' unstackable>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Items:</Table.Cell>
                <Table.Cell textAlign='right'>${order.itemsPrice}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Shipping & handling:</Table.Cell>
                <Table.Cell textAlign='right'> ${order.shippingCost}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Tax:</Table.Cell>
                <Table.Cell textAlign='right'> ${order.taxPrice}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Total:</Table.Cell>
                <Table.Cell textAlign='right'>${order.orderTotal}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
        {!order.isPaid && (
          <div>
            {payLoading && <Loader />}
            {!sdkLoaded ? <Loader /> : <PayPalButton amount={order.orderTotal} onSuccess={successPaymentHandler} />}
          </div>
        )}
      </div>
    </div>
  );
};

const style = {
  padding: '8px ',
  marginTop: '5px',
};
export default OrderScreen;