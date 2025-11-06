// ********************* CÓDIGO COM ARDUINO FÍSICO ******************

 // importa os bibliotecas necessários
 const serialport = require('serialport');
 const express = require('express');
 const mysql = require('mysql2');

 // constantes para configurações
 const SERIAL_BAUD_RATE = 9600;
 const SERVIDOR_PORTA = 3300;

 // habilita ou desabilita a inserção de dados no banco de dados
 const HABILITAR_OPERACAO_INSERIR = true;

 // função para comunicação serial
 const serial = async (
     valoresSensorAnalogico,
     valoresSensorDigital,
 ) => {

     // conexão com o banco de dados MySQL
     let poolBancoDados = mysql.createPool(
        {
             host: '127.0.0.1',
             user: 'aluno',
             password: 'Sptech#2024',
             database: 'Ecolight',
             port: 3307
         }
     ).promise();

     // lista as portas seriais disponíveis e procura pelo Arduino
     const portas = await serialport.SerialPort.list();
     const portaArduino = portas.find((porta) => porta.vendorId == 2341 && porta.productId == 43);
     if (!portaArduino) {
         throw new Error('O arduino não foi encontrado em nenhuma porta serial');
     }

     // configura a porta serial com o baud rate especificado
     const arduino = new serialport.SerialPort(
         {
             path: portaArduino.path,
             baudRate: SERIAL_BAUD_RATE
         }
     );

     // evento quando a porta serial é aberta
     arduino.on('open', () => {
         console.log(`A leitura do arduino foi iniciada na porta ${portaArduino.path} utilizando Baud Rate de ${SERIAL_BAUD_RATE}`);
     });

     // processa os dados recebidos do Arduino
     arduino.pipe(new serialport.ReadlineParser({ delimiter: '\r\n' })).on('data', async (data) => {
         console.log(data);
         const valores = data.split(';');
         var sensorAnalogico = parseFloat(valores[0]);
         const sensorDigital = parseInt(valores[1]);

         // Converter LUX para %
         sensorAnalogico = (sensorAnalogico * 100 / 2174)

         // armazena os valores dos sensores nos arrays correspondentes
         valoresSensorAnalogico.push(sensorAnalogico);
         valoresSensorDigital.push(sensorDigital);

         // insere os dados no banco de dados (se habilitado)
         if (HABILITAR_OPERACAO_INSERIR) {

            // este insert irá inserir os dados na tabela "medida"
             await poolBancoDados.execute(
                 `INSERT INTO regSensor (intensidadeLuz, fkSensor) VALUES (${sensorAnalogico}, 1)`,
             );
             console.log(sensorAnalogico);
             await poolBancoDados.execute(
                 `INSERT INTO regSensor (intensidadeLuz, fkSensor) VALUES (${sensorAnalogico + 2}, 2)`,
             );
             console.log(sensorAnalogico + 10);
             await poolBancoDados.execute(
                 `INSERT INTO regSensor (intensidadeLuz, fkSensor) VALUES (${sensorAnalogico + 4}, 3)`,
             );
             console.log(sensorAnalogico + 3);
         }
     });

     // evento para lidar com erros na comunicação serial
     arduino.on('error', (mensagem) => {
         console.error(`Erro no arduino (Mensagem: ${mensagem}`)
     });
 }

 // função para criar e configurar o servidor web
 const servidor = (
     valoresSensorAnalogico,
     valoresSensorDigital ) => {
     const app = express();

     // configurações de requisição e resposta
     app.use((request, response, next) => {
         response.header('Access-Control-Allow-Origin', '*');
         response.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
         next();
     });

     // inicia o servidor na porta especificada
    app.listen(SERVIDOR_PORTA, () => {
         console.log(`API executada com sucesso na porta ${SERVIDOR_PORTA}`);
     });

     // define os endpoints da API para cada tipo de sensor
     app.get('/sensores/analogico', (_, response) => {
         return response.json(valoresSensorAnalogico);
     });
     app.get('/sensores/digital', (_, response) => {
         return response.json(valoresSensorDigital);
     });
 }

 // função principal assíncrona para iniciar a comunicação serial e o servidor web
 (async () => {
     // arrays para armazenar os valores dos sensores
     const valoresSensorAnalogico = [];
     const valoresSensorDigital = [];

     // inicia a comunicação serial
     await serial(
         valoresSensorAnalogico,
         valoresSensorDigital
     );

     // inicia o servidor web
     servidor(
         valoresSensorAnalogico,
         valoresSensorDigital
     );
 })();












































 // *************** SIMULADOR DE SENSOR *************

/*

// importa as bibliotecas necessárias
const express = require('express');
const mysql = require('mysql2');

// constantes para configurações
const SERVIDOR_PORTA = 3300;

// habilita ou desabilita a inserção de dados no banco de dados
const HABILITAR_OPERACAO_INSERIR = true;

// função para gerar dados mockados no lugar da leitura serial
const gerarDadosMockados = async (
    valoresSensorAnalogico
) => {
    // conexão com o banco de dados MySQL (permite inserção simulada)
    let poolBancoDados = mysql.createPool(
        {
            host: '127.0.0.1',
            user: 'aluno',
            password: 'Sptech#2024',
            database: 'Ecolight',
            port: 3307
        }
    ).promise();

    console.log("Iniciando geração de dados mockados...");

    // intervalo que gera novos valores a cada 2 segundos simulando leituras reais
    setInterval(async () => {
        // gera um valor aleatório entre 10% e 40% para simular o sensor LDR35
        const sensorAnalogico = (Math.random() * 30 + 10).toFixed(2);

        // gera um valor digital aleatório (0 ou 1)

        // armazena os valores simulados nos arrays originais
        valoresSensorAnalogico.push(parseFloat(sensorAnalogico));

        console.log(sensorAnalogico);

        // caso o armazenamento no banco esteja habilitado, insere os valores simulados
        if (HABILITAR_OPERACAO_INSERIR) {
            await poolBancoDados.execute(
                `INSERT INTO regSensor (intensidadeLuz, fkSensor) VALUES (${sensorAnalogico}, 4)`,
                
            );
            console.log(sensorAnalogico);
        }

    }, 1000); // intervalo de geração das leituras simuladas
}

// função para criar e configurar o servidor web
const servidor = (
    valoresSensorAnalogico
) => {
    const app = express();

    // configurações de requisição e resposta
    app.use((request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
        next();
    });

    // inicia o servidor na porta especificada
    app.listen(SERVIDOR_PORTA, () => {
        console.log(`API executada com sucesso na porta ${SERVIDOR_PORTA}`);
    });

    // define os endpoints da API para cada tipo de sensor
    app.get('/sensores/analogico', (_, response) => {
        return response.json(valoresSensorAnalogico);
    });
}

// função principal assíncrona para iniciar a simulação e o servidor web
(async () => {
    // arrays para armazenar os valores dos sensores
    const valoresSensorAnalogico = [];

    // inicia a geração dos dados simulados (substitui a leitura da porta serial)
    await gerarDadosMockados(
        valoresSensorAnalogico
    );

    // inicia o servidor web
    servidor(
        valoresSensorAnalogico
    );
})(); 

*/

