import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as path from "path"

export class WellTypedStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const names = [
      "AskAboutWeather",
      "LookAtTheClouds",
      "SayGoodbye",
      "SayHello",
    ] as const;
    type lambdaNamesType = typeof names[number];
    type lambdaFnsType = { [key in lambdaNamesType]: lambda.Function };
    type lambdaFnConfigType = { [key in lambdaNamesType]: { path: string } };

    const lambdaFnConfig: lambdaFnConfigType = {
      AskAboutWeather: {
        path: "ask_about_weather",
      },
      LookAtTheClouds: {
        path: "look_at_the_clouds",
      },
      SayHello: {
        path: "say_hello",
      },
      SayGoodbye: {
        path: "say_goodbye",
      },
    };

    const runtime = lambda.Runtime.PYTHON_3_7;
    const timeout = cdk.Duration.seconds(20);
    const directory = "lambda"

    // convert an array of key value pair to an object
    const functions = Object.fromEntries(
      // map names in each function to a different return value
      names.map((fnName: lambdaNamesType) => {
        // values unique to each function
        let code = lambda.Code.fromAsset(path.join(directory, lambdaFnConfig[fnName].path));
        let handler = "lambda_function.lambda_handler";

        // create the function
        let fn = new lambda.Function(this, fnName, {
          handler,
          code,
          runtime,
          timeout,
        });

        // return function name and function object, this will be converted to a key value pair
        return [fnName, fn];
      })
    ) as lambdaFnsType;

    type stateNames = typeof names[number];
    type statesType = { [key in stateNames]: tasks.LambdaInvoke };
    type stateConfigType = {
      [key in stateNames]: {
        lambdaFunction: lambda.Function;
        resultPath: string;
      };
    };

    const stateConfig: stateConfigType = {
      AskAboutWeather: {
        lambdaFunction: functions.AskAboutWeather,
        resultPath: "$.weather",
      },
      LookAtTheClouds: {
        lambdaFunction: functions.LookAtTheClouds,
        resultPath: "$.clouds",
      },
      SayGoodbye: {
        lambdaFunction: functions.SayGoodbye,
        resultPath: "$.goodbye",
      },
      SayHello: {
        lambdaFunction: functions.SayHello,
        resultPath: "$.hello",
      },
    };

    const retryOnServiceExceptions = false;
    const payloadResponseOnly = true;

    const states: statesType = Object.fromEntries(
      names.map((stateName: stateNames) => {
        let state = new tasks.LambdaInvoke(this, `State${stateName}`, {
          ...stateConfig[stateName],
          retryOnServiceExceptions,
          payloadResponseOnly,
        });
        return [stateName, state];
      })
    ) as statesType;

    states.LookAtTheClouds.next(states.AskAboutWeather)

    // The state machine makes polite conversation using 4 states
    // It greets the user with a hello
    // It asks the user about the weather
    // If the weather is sunny our cloudy
    // then it describes the shape of the clouds
    // otherwise it bids the user a goodbye
    const definition = states.SayHello.next(
      states.AskAboutWeather.next(
        new sfn.Choice(this, "WeatherChoice")
          .when(
            sfn.Condition.stringEquals("$.weather", "rainy"),
            states.SayGoodbye
          )
          .when(
            sfn.Condition.stringEquals("$.weather", "cloudy"),
            states.LookAtTheClouds
          )
          .when(
            sfn.Condition.stringEquals("$.weather", "sunny"),
            states.LookAtTheClouds
          )
      )
    );

    new sfn.StateMachine(this, "WeatherMachine", {
      definition,
    })
  }
}
