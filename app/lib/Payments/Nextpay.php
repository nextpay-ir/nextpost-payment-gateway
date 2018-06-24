<?php
namespace Payments;

use SoapClient;


/**
 * Nextpay Payment Gateway
 */
class Nextpay extends AbstractGateway
{

    private $integrations;
    private $settings;

    /**
     * Init.
     */
    public function __construct()
    {
        $this->integrations = \Controller::model("GeneralData", "integrations");
        $this->settings = \Controller::model("GeneralData", "site-settings");

    }


    /**
     * Place Order
     *
     * Generate payment page url here and return it
     * @return string URL of the payment page
     */
    public function placeOrder($params = [])
    {
        $Order = $this->getOrder();
        if (!$Order) {
            throw new \Exception('Set order before calling AbstractGateway::placeOrder()');
        }

        if (!in_array($Order->get("status"), ["payment_processing", "subscription_processing"])) {
            throw new \Exception('Invalid order status');
        }

        $User = $this->getUser();
        if (!$User->isAvailable() || !$User->get("is_active")) {
            throw new \Exception('User is not available or active');
        }

        return $this->placeOnetimeOrder($params);

    }


    /**
     * Handle one time payment
     * @param  array  $params
     * @return string URL of the payment page
     */
    private function placeOnetimeOrder($params = [])
    {
        $Order = $this->getOrder();
        if (!$Order) {
            throw new \Exception('Set order before calling AbstractGateway::placeOrder()');
        }

        if ($Order->get("status") != "payment_processing") {
            throw new \Exception('Order status must be payment_processing to place it');
        }


        $amount = $Order->get("total") ;
        $currency = $this->settings->get("data.currency");
        if ($currency == 'IRR') {
            $amount = $amount /10; // convert to toman
        }

        $callback_uri = APPURL."/checkout/".$Order->get("id").".".sha1($Order->get("id").NP_SALT);

        try {
          // Send Token request to nextpay
          $client = new SoapClient('https://api.nextpay.org/gateway/token.wsdl', array('encoding' => 'UTF-8'));
          $result = $client->TokenGenerator(
              array(
                  'api_key' 	=> $this->integrations->get("data.nextpay.api_key"),
                  'order_id'	=> $Order->get("id"),
                  'amount' 		=> $amount,
                  'callback_uri' 	=> $callback_uri
              )
          );
          $result = $result->TokenGeneratorResult;

          if($result->code == -1){
                // Updating order...
               $Order->set("payment_id", $result->trans_id)
                   ->update();
                $url = "https://api.nextpay.org/gateway/payment/". $result->trans_id;
            } else {
                $Order->delete();
                $url = APPURL."/checkout/error";
            }
        } catch (\Exception $e) {
            $Order->delete();
            $url = APPURL."/checkout/error";
        }

        return $url;
    }




    /**
     * Payment callback
     * @return boolean [description]
     */
    public function callback($params = [])
    {
        // Payment processing has already been finished
        // Order processing has already been finished
        // Just check paymentId for URL validation

        if (empty($params["paymentId"])) {
            throw new \Exception(__('System detected logical error').": invalid_payment_id");
        }

        $paymentId = $params["paymentId"];

        $Order = $this->getOrder();
        if (!$Order) {
            throw new \Exception('Set order before calling AbstractGateway::placeOrder()');
        }

        if ($Order->get("payment_id") != $paymentId) {
            throw new \Exception(__("Couldn't get payment information"));
        }

        if (in_array($Order->get("status"), ["paid", "subscribed"])) {
            return true;
        }

        $amount = $Order->get("total") ;
        $currency = $this->settings->get("data.currency");
        if ($currency == 'IRR') {
            $amount = $amount /10; // convert to toman
        }


        // Send Token request to nextpay
        $client = new SoapClient('https://api.nextpay.org/gateway/verify.wsdl', array('encoding' => 'UTF-8'));
        $result = $client->PaymentVerification(
            array(
                'api_key' 	=> $this->integrations->get("data.nextpay.api_key"),
                'order_id'	=> $Order->get("id"),
                'amount' 		=> $amount,
                'trans_id' 	=> $paymentId
            )
        );
        $result = $result->PaymentVerificationResult;

        if ($result->code == 0) { //Success payment
          // Payment finished,
          // Finish order processing
          $Order->finishProcessing();

          // Updating order...
          $Order->set("status","paid")
                ->set("paid",$amount)
                ->update();
          return true;
        }

        return false;
    }
}
