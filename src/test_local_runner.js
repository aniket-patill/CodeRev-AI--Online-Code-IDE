const axios = require('axios');

async function testRunner() {
    // Runner is exposed on port 4000 (since Docker was started with -p 4000:3000)
    const runnerUrl = 'http://localhost:4000';
    const API_KEY = 'testkey';

    console.log(`Checking runner health at ${runnerUrl}/health...`);

    try {
        const health = await axios.get(`${runnerUrl}/health`);
        console.log('✅ Runner is healthy:', health.data);
    } catch (error) {
        console.error('❌ Runner health check failed:', error.message);
        console.log('Make sure Docker runner is running:');
        console.log('docker run -p 4000:3000 -e API_KEY=testkey codebae-runner');
        return;
    }

    console.log('\nTesting Java execution on local runner...');

    try {
        const response = await axios.post(
            `${runnerUrl}/execute`,
            {
                language: 'java',
                code: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Local Runner!");
    }
}
                `,
                input: '',
                timeout: 5000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                }
            }
        );

        console.log('\n🟢 Execution Response:');
        console.log(response.data);

    } catch (error) {
        console.error(
            '\n🔴 Execution Request Failed:',
            error.response ? error.response.data : error.message
        );
    }

    console.log('\nTesting C++ execution on local runner...');

    try {
        const response = await axios.post(
            `${runnerUrl}/execute`,
            {
                language: 'cpp',
                code: `
#include <iostream>
int main() {
    std::cout << "Hello from C++ Runner!";
    return 0;
}
                `,
                input: '',
                timeout: 5000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                }
            }
        );

        console.log('\n🟢 C++ Execution Response:');
        console.log(response.data);

    } catch (error) {
        console.error(
            '\n🔴 C++ Execution Failed:',
            error.response ? error.response.data : error.message
        );
    }
}

testRunner();
