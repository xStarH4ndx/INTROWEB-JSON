import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { mongoErrorHandler } from 'src/utils/mongo-error-handler';
import { MongoError } from 'mongodb';
import { STATUS_CODES } from 'http';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    try {

      const {password,...rest} = createUserDto;

      
      const hashPassword = await bcrypt.hash(password,10);
      const newUser =
      {
        ...rest,
        password:hashPassword,
      }
      return await this.userModel.create(newUser);
      
    } catch (error) {
      if ((error as Record<string, number>)?.code)
        mongoErrorHandler(error as MongoError);
      throw new Error(error as string);
    }
  }

  async findAll() {
    return await this.userModel.find().exec();
  }

  findOne(id: string) {
    return this.userModel.findById(id).exec();
  }
  async findOneByEmail(email?:string)
  {
    if(!email) throw new NotFoundException(`El email no ha sido ingresado`)
    try{
      const user = await this.userModel.findOne({email}).exec();
      return user;
    }
    catch(error){
      if(error instanceof Error){
      throw new InternalServerErrorException(`El error al buscar el usuario:${error}`);
      }
      else{
        throw new InternalServerErrorException(`El error al buscar el usuario es desconocido`);
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.userModel.updateOne({ _id: id }, updateUserDto);
    } catch (error: unknown) {
      if ((error as Record<string, number>)?.code)
        mongoErrorHandler(error as MongoError);
      throw new Error(error as string);
    }
  }

  async remove(id: string) {
    return await this.userModel.deleteOne({ _id: id });
  }
}
