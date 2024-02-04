import request from 'supertest';
import app from '../app';

describe('Auth Controller Tests', () => {
    it('should be able to create a new user', async () => {
        request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                username: 'TestUser',
                email: 'test@email.com',
                password: 'Upt5@Rhjjgg=',
                confirmPassword: 'Upt5@Rhjjgg=',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) throw err;
            });
    });

    it('should be able to login', async () => {
        request(app)
            .post('/auth/login')
            .send({
                username: 'TestUser',
                password: 'xxxx@xxxxxxx',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) throw err;
            });
    });
});

