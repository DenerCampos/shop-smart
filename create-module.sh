#!/bin/bash

# Script para criar estrutura de módulo
# Autor: Script Generator
# Descrição: Cria estrutura de pastas e arquivos para um módulo

echo "==================================="
echo "  GERADOR DE ESTRUTURA DE MÓDULO  "
echo "==================================="
echo

# Verifica se o nome foi passado como argumento
if [ -n "$1" ]; then
    module_name="$1"
else
    # Solicita o nome do módulo se não foi passado como argumento
    read -p "Digite o nome do módulo: " module_name
fi

# Verifica se o nome foi informado
if [ -z "$module_name" ]; then
    echo "❌ Erro: Nome do módulo não pode estar vazio!"
    exit 1
fi

# Converte para lowercase para padronização
module_name=$(echo "$module_name" | tr '[:upper:]' '[:lower:]')

echo
echo "📁 Criando estrutura para o módulo: $module_name"
echo

# Cria o diretório src se não existir
if [ ! -d "src" ]; then
    mkdir src
    echo "✅ Diretório 'src' criado"
fi

# Define o caminho base do módulo
module_path="src/$module_name"

# Verifica se o módulo já existe
if [ -d "$module_path" ]; then
    echo "⚠️  Módulo '$module_name' já existe!"
    read -p "Deseja sobrescrever? (s/N): " overwrite
    if [[ ! $overwrite =~ ^[Ss]$ ]]; then
        echo "❌ Operação cancelada"
        exit 1
    fi
    echo "🗑️  Removendo módulo existente..."
    rm -rf "$module_path"
fi

# Cria a estrutura de diretórios
echo "📂 Criando estrutura de diretórios..."
mkdir -p "$module_path"/{interfaces,dto,entities,models,repositories,test,types}

# Cria os arquivos
echo "📄 Criando arquivos..."

# interfaces/"nome".repository.interface.ts
cat > "$module_path/interfaces/$module_name.repository.interface.ts" << EOF
import { Create${module_name^}Dto } from '../dto/create${module_name^}.dto';
import { Update${module_name^}Dto } from '../dto/update${module_name^}.dto';
import ${module_name^} from '../entities/${module_name}.entity';

export interface I${module_name^}Repository {
  create(new${module_name^}: Create${module_name^}Dto): Promise<${module_name^}>;
  findAll(page: number, limit: number): Promise<[${module_name^}[], number]>;
  find(id: string): Promise<${module_name^} | null>;
  update(id: string, update${module_name^}: Update${module_name^}Dto): Promise<${module_name^}>;
  remove(id: string): Promise<${module_name^}>;
  delete(id: string): Promise<boolean>;
  countAll(): Promise<number>;
}
EOF

# entities/"nome".entity.ts
cat > "$module_path/entities/$module_name.entity.ts" << EOF
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ${module_name^} {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  // Defina aqui as propriedades da entidade

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
EOF

# models/"nome".models.ts
cat > "$module_path/models/$module_name.models.ts" << EOF
export class ${module_name^}Model {
  id: string | number;
  // Defina aqui as propriedades do modelo caso exista/precisa
  // Lembrando que caso exista a entidade, não tem necessidade de model

  constructor(data: Partial<${module_name^}Model>) {
    this.id = data.id;
  }
}
EOF

# test/"nome".controller.spec.ts
cat > "$module_path/test/$module_name.controller.spec.ts" << EOF
import { Test, TestingModule } from '@nestjs/testing';
import { ${module_name^}Controller } from '../${module_name}.controller';

describe('${module_name^}Controller', () => {
  let controller: ${module_name^}Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${module_name^}Controller],
    }).compile();

    controller = module.get<${module_name^}Controller>(${module_name^}Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
EOF

# types/"nome"Type.ts
cat > "$module_path/types/${module_name}Type.ts" << EOF
export type ${module_name^}Type = {
  // Defina aqui os tipos relacionados ao módulo
};
EOF

# "nome".controller.ts
cat > "$module_path/$module_name.controller.ts" << EOF
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ${module_name^}Service } from './${module_name}.service';
import { Create${module_name^}Dto } from './dto/create-${module_name}.dto';
import { Update${module_name^}Dto } from './dto/update-${module_name}.dto';
import { ${module_name^}ResponseDto } from './dto/${module_name}-response.dto';
import { ResponseService } from 'src/common/response/response';
import { ${module_name^}ListDto } from './dto/${module_name}-list.dto';
import { paginationData } from 'src/common/pagination/pagination';

@Controller('/${module_name}')
export class ${module_name^}Controller {
  // Implementar métodos do controller
  constructor(
    private readonly ${module_name}Service: ${module_name^}Service,
    private readonly responseService: ResponseService,  
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() create${module_name^}Dto: Create${module_name^}Dto): Promise<${module_name^}> {
    const create${module_name^} = await this.${module_name}Service.create(create${module_name^}Dto);

    return this.responseService.mapToDto(${module_name^}ResponseDto, create${module_name^});
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(
     @Query() listDto: ${module_name^}ListDto,
  ): Promise<paginationData<${module_name^}>> {
    const ${module_name}s = await this.${module_name}Service.findAll(listDto);

    return this.responseService.mapPaginatedToDto(${module_name^}ResponseDto, ${module_name}s);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<${module_name^}> {
    const ${module_name} = await this.${module_name}Service.find(id);

    return this.responseService.mapToDto(${module_name^}ResponseDto, ${module_name});
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() update${module_name^}Dto: Update${module_name^}Dto,
  ): Promise<${module_name^}> {
    const ${module_name} = await this.${module_name}Service.update(id, update${module_name^}Dto);

    return this.responseService.mapToDto(${module_name^}ResponseDto, ${module_name});
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.${module_name}Service.delete(id);

    return { deleted };
  }
}
EOF

# "nome".module.ts
cat > "$module_path/$module_name.module.ts" << EOF
import { Module } from '@nestjs/common';
import { ${module_name^}Controller } from './${module_name}.controller';
import { ${module_name^}Service } from './${module_name}.service';
import { ${module_name^}Repository } from './${module_name}.repository';
import { ${module_name^} } from './entities/${module_name}.entity';

@Module({
  imports: [CommonModule],
  controllers: [${module_name^}Controller],
  providers: [
    ${module_name^}Service,
    {
      provide: 'I${module_name^}Repository',
      useClass: ${module_name^}Repository,
    },
  ],
  exports: [${module_name^}Service, 'I${module_name^}Repository'],
})
export class ${module_name^}Module {}
EOF

# "nome".repository.ts
cat > "$module_path/repositories/$module_name.repository.ts" << EOF
import { Injectable } from '@nestjs/common';
import { I${module_name^}Repository } from './interfaces/${module_name}.repository.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ${module_name^} } from './entities/${module_name}.entity';
import { Create${module_name^}Dto } from './dto/create${module_name^}.dto';
import { Update${module_name^}Dto } from './dto/update${module_name^}.dto';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';

@Injectable()
export class ${module_name^}Repository implements I${module_name^}Repository {
  constructor(
    @InjectRepository(${module_name^})
    private ${module_name}Entity: Repository<${module_name^}>,
  ) {}

  async create(create${module_name^}Dto: Create${module_name^}Dto): Promise<${${module_name^}> {
    // const ${module_name} = await this.${module_name}Entity.findOne({
    //   where: {
    //     name: ILike(`%${create${module_name^}Dto.name}%`),
    //   },
    // }); //Caso precise buscar pelo nome

    // if (${module_name}) {
    //  return ${module_name};
    // } //Caso precise buscar pelo nome

    const new${module_name^} = this.${module_name}Entity.create(create${module_name^}Dto);

    return await this.${module_name}Entity.save(new${module_name^});
  }

  async findAll(page: number, limit: number): Promise<[${module_name^}[], number]> {
    const queryBuilder = this.${module_name}Entity.createQueryBuilder('${module_name}');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  async countAll(): Promise<number> {
    return await this.${module_name}Entity.count({
      withDeleted: false,
    });
  }

  async find(id: string): Promise<${${module_name^} | null> {
    return = await this.${module_name}Entity.findOneBy({ id });
  }

  async update(
    id: string,
    update${module_name^}Dto: Update${module_name^}Dto,
  ): Promise<${${module_name^}> {
    const update${module_name^} = await this.${module_name}Entity.findOneBy({ id });

    if (!update${module_name^}) {
      throw new UpdateException();
    }

    // const exist${module_name^} = await this.${module_name}Entity.findOne({
    //  where: {
    //    name: ILike(`%${update${module_name^}Dto.name}%`),
    //    id: Not(Equal(update${module_name^}.id)),
    //  },
    // });

    // if (exist${module_name^}) {
    //  throw new AlreadyExistsException();
    // } // caso precisa verificar se ja existe com o mesmo nome

    const ${module_name} = await this.${module_name}Entity.save({
      ...update${module_name^},
      ...update${module_name^}Dto,
    });

    return ${module_name};
  }

  async remove(id: string): Promise<${${module_name^}> {
    const ${module_name} = await this.${module_name}Entity.findOneBy({ id });

    if (${module_name}) {
      throw new RemoveException();
    }

    await this.${module_name}Entity.remove(${module_name});
    return ${module_name};
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.${module_name}Entity.softDelete({ id });

    return result.affected === 1;
  }
}
EOF

# "nome".service.ts
cat > "$module_path/$module_name.service.ts" << EOF
import { Inject, Injectable } from '@nestjs/common';
import { I${module_name^}Repository } from './interfaces/${module_name}.repository.interface';
import { Create${module_name^}Dto } from './dto/create${module_name^}.dto';
import { Update${module_name^}Dto } from './dto/update${module_name^}.dto';
import { ${module_name^}ResponseDto } from './dto/${module_name}-response.dto';
import { plainToClass } from 'class-transformer';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { ${module_name^}ListDto } from './dto/${module_name}-list.dto';

@Injectable()
export class ${module_name^}Service {
  private url = `${this.appConfig.getBaseUrl()}/${module_name}`;

  constructor(
    @Inject('I${module_name^}Repository')
    private ${module_name}Repository: I${module_name^}Repository
    private pagination: Pagination,
  ) {}

  async create(create${module_name^}Dto: Create${module_name^}Dto): Promise<${module_name^}> {
    return await this.${module_name}Repository.create(create${module_name^}Dto);
  }

  async findAll(${module_name}List: ${module_name^}ListDto): Promise<paginationData<${module_name^}>> {
    const offset = this.pagination.getOffset(${module_name}List.page, ${module_name}List.limit);

    const [${module_name}s, total] = await this.${module_name}Repository.findAll(
      offset,
      ${module_name}List.limit,
    );

    const paginateData = this.pagination.paginateData<User>(
      ${module_name}s,
      ${module_name}List.page,
      ${module_name}List.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(${module_name}Id: string): Promise<${module_name^}> | null> {
    return await this.${module_name}Repository.find(${module_name}Id);
  }

  async update(
    ${module_name}Id: string,
    update${module_name^}Dto: Update${module_name^}Dto,
  ): Promise<${module_name^}> {
    return await this.${module_name}Repository.update(${module_name}Id, update${module_name^}Dto);
  }

  async remove(${module_name}Id: string): Promise<${module_name^}> {
    return await this.${module_name}Repository.remove(${module_name}Id);
  }

  async delete(${module_name}Id: string): Promise<boolean> {
    return this.${module_name}Repository.delete(${module_name}Id);
  }
}
EOF

# Cria create e update DTO
cat > "$module_path/dto/create${module_name^}.dto.ts" << EOF
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class Create${module_name^}Dto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  value: number; // alterar nome
}
EOF

cat > "$module_path/dto/update-${module_name}.dto.ts" << EOF
import { IsNumber, IsOptional } from 'class-validator';
import { Create${module_name^}Dto } from './create${module_name^}.dto';
import { PartialType } from '@nestjs/swagger';

export class Update${module_name^}Dto extends PartialType(Create${module_name^}Dto) {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsNumber()
  value: number; // alterar nome
}
EOF

cat > "$module_path/dto/${module_name}-response.dto.ts" << EOF
import { Exclude, Expose } from 'class-transformer';

export class ${module_name^}ResponseDto {
  @Exclude()
  id: string;

  @Expose()
  name: string;
} 
EOF

cat > "$module_path/dto/${module_name}-listDto.dto.ts" << EOF
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ${module_name^}ListDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
} 
EOF

echo
echo "✅ Estrutura criada com sucesso!"
echo
echo "📁 Estrutura gerada:"
echo "$module_path/"
tree "$module_path" 2>/dev/null || find "$module_path" -type f | sed 's/^/  /'

echo
echo "🎉 Módulo '$module_name' criado em: $module_path"
echo "💡 Dica: Não esqueça de adicionar o módulo ao app.module.ts!"