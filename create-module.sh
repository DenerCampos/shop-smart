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

# Função para capitalizar primeira letra
capitalize() {
    echo "$1" | sed 's/^./\U&/'
}

# Define variáveis para facilitar o uso
module_name_cap=$(capitalize "$module_name")

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
import { Create${module_name_cap}Dto } from '../dto/create-${module_name}.dto';
import { Update${module_name_cap}Dto } from '../dto/update-${module_name}.dto';
import { ${module_name_cap} } from '../entities/${module_name}.entity';
import { EntityManager } from 'typeorm';

export interface I${module_name_cap}Repository {
  create(
    new${module_name_cap}: Create${module_name_cap}Dto,
    manager?: EntityManager,
  ): Promise<${module_name_cap}>;
  findAll(page: number, limit: number): Promise<[${module_name_cap}[], number]>;
  find(id: string): Promise<${module_name_cap} | null>;
  update(
    ${module_name}: ${module_name_cap},
    update${module_name_cap}: Update${module_name_cap}Dto,
    manager?: EntityManager,
  ): Promise<${module_name_cap}>;
  remove(${module_name}: ${module_name_cap}): Promise<${module_name_cap}>;
  delete(${module_name}: ${module_name_cap}): Promise<${module_name_cap}>;
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
export class ${module_name_cap} {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  // Defina aqui as propriedades da entidade

  @Column()
  name: string; // Exemplo

  @Column()
  value: number; // Exemplo

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
export class ${module_name_cap}Model {
  id: string | number;
  // Defina aqui as propriedades do modelo caso exista/precisa
  // Lembrando que caso exista a entidade, não tem necessidade de model

  constructor(data: Partial<${module_name_cap}Model>) {
    this.id = data.id;
  }
}
EOF

# test/"nome".controller.spec.ts
cat > "$module_path/test/$module_name.controller.spec.ts" << EOF
import { Test, TestingModule } from '@nestjs/testing';
import { ${module_name_cap}Controller } from '../${module_name}.controller';

describe('${module_name_cap}Controller', () => {
  let controller: ${module_name_cap}Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${module_name_cap}Controller],
    }).compile();

    controller = module.get<${module_name_cap}Controller>(${module_name_cap}Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
EOF

# types/"nome"Type.ts
cat > "$module_path/types/${module_name}Type.ts" << EOF
export type ${module_name_cap}Type = {
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
import { ${module_name_cap}Service } from './${module_name}.service';
import { Create${module_name_cap}Dto } from './dto/create-${module_name}.dto';
import { Update${module_name_cap}Dto } from './dto/update-${module_name}.dto';
import { ResponseService } from 'src/common/response/response';
import { ${module_name_cap}ListDto } from './dto/${module_name}-list.dto';
import { ${module_name_cap}ResponseDto } from './dto/${module_name}-response.dto';
import { paginationData } from 'src/common/pagination/pagination';

@Controller('/${module_name}')
export class ${module_name_cap}Controller {
  // Implementar métodos do controller
  constructor(
    private readonly ${module_name}Service: ${module_name_cap}Service,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() create${module_name_cap}Dto: Create${module_name_cap}Dto,
  ): Promise<${module_name_cap}ResponseDto> {
    const create${module_name_cap} = await this.${module_name}Service.create(create${module_name_cap}Dto);

    return this.responseService.mapToDto(${module_name_cap}ResponseDto, create${module_name_cap});
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: ${module_name_cap}ListDto,
  ): Promise<paginationData<${module_name_cap}ResponseDto>> {
    const ${module_name}s = await this.${module_name}Service.findAll(listDto);

    return this.responseService.mapPaginatedToDto(${module_name_cap}ResponseDto, ${module_name}s);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<${module_name_cap}ResponseDto> {
    const ${module_name} = await this.${module_name}Service.find(id);

    return this.responseService.mapToDto(${module_name_cap}ResponseDto, ${module_name});
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() update${module_name_cap}Dto: Update${module_name_cap}Dto,
  ): Promise<${module_name_cap}ResponseDto> {
    const ${module_name} = await this.${module_name}Service.update(id, update${module_name_cap}Dto);

    return this.responseService.mapToDto(${module_name_cap}ResponseDto, ${module_name});
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
import { ${module_name_cap}Controller } from './${module_name}.controller';
import { ${module_name_cap}Service } from './${module_name}.service';
import { ${module_name_cap}Repository } from './repositories/${module_name}.repository';
import { ${module_name_cap} } from './entities/${module_name}.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([${module_name_cap}])],
  controllers: [${module_name_cap}Controller],
  providers: [
    ${module_name_cap}Service,
    {
      provide: 'I${module_name_cap}Repository',
      useClass: ${module_name_cap}Repository,
    },
  ],
  exports: [${module_name_cap}Service, 'I${module_name_cap}Repository'],
})
export class ${module_name_cap}Module {}
EOF

# "nome".repository.ts
cat > "$module_path/repositories/$module_name.repository.ts" << EOF
import { Injectable } from '@nestjs/common';
import { I${module_name_cap}Repository } from '../interfaces/${module_name}.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ${module_name_cap} } from '../entities/${module_name}.entity';
import { Create${module_name_cap}Dto } from '../dto/create-${module_name}.dto';
import { Update${module_name_cap}Dto } from '../dto/update-${module_name}.dto';

@Injectable()
export class ${module_name_cap}Repository implements I${module_name_cap}Repository {
  constructor(
    @InjectRepository(${module_name_cap})
    private ${module_name}Entity: Repository<${module_name_cap}>,
  ) {}

  async create(
    create${module_name_cap}Dto: Create${module_name_cap}Dto,
    manager?: EntityManager,
  ): Promise<${module_name_cap}> {
    const repository = manager
      ? manager.getRepository(${module_name_cap})
      : this.${module_name}Entity;

    const new${module_name_cap} = repository.create(create${module_name_cap}Dto);

    return await repository.save(new${module_name_cap});
  }

  async findAll(page: number, limit: number): Promise<[${module_name_cap}[], number]> {
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

  async find(id: string): Promise<${module_name_cap} | null> {
    return await this.${module_name}Entity.findOneBy({ id });
  }

  async update(
    ${module_name}: ${module_name_cap},
    update${module_name_cap}Dto: Update${module_name_cap}Dto,
    manager?: EntityManager,
  ): Promise<${module_name_cap}> {
    const repository = manager
      ? manager.getRepository(${module_name_cap})
      : this.${module_name}Entity;

    return await repository.save({
      ...${module_name},
      ...update${module_name_cap}Dto,
    });
  }

  async remove(${module_name}: ${module_name_cap}): Promise<${module_name_cap}> {
    await this.${module_name}Entity.remove(${module_name});

    return ${module_name};
  }

  async delete(${module_name}: ${module_name_cap}): Promise<${module_name_cap}> {
    await this.${module_name}Entity.softDelete(${module_name});

    return ${module_name};
  }
}
EOF

# "nome".service.ts
cat > "$module_path/$module_name.service.ts" << EOF
import { Inject, Injectable } from '@nestjs/common';
import { I${module_name_cap}Repository } from './interfaces/${module_name}.repository.interface';
import { Create${module_name_cap}Dto } from './dto/create-${module_name}.dto';
import { Update${module_name_cap}Dto } from './dto/update-${module_name}.dto';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { ${module_name_cap}ListDto } from './dto/${module_name}-list.dto';
import { EntityManager } from 'typeorm';
import { ${module_name_cap} } from './entities/${module_name}.entity';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';

@Injectable()
export class ${module_name_cap}Service {
  private url = \`\${this.appConfig.getBaseUrl()}/${module_name}\`;

  constructor(
    @Inject('I${module_name_cap}Repository')
    private ${module_name}Repository: I${module_name_cap}Repository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {}

  async create(
    create${module_name_cap}Dto: Create${module_name_cap}Dto,
    manager?: EntityManager,
  ): Promise<${module_name_cap}> {
    return await this.${module_name}Repository.create(create${module_name_cap}Dto, manager);
  }

  async findAll(${module_name}List: ${module_name_cap}ListDto): Promise<paginationData<${module_name_cap}>> {
    const offset = this.pagination.getOffset(
      ${module_name}List.page,
      ${module_name}List.limit,
    );

    const [${module_name}s, total] = await this.${module_name}Repository.findAll(
      offset,
      ${module_name}List.limit,
    );

    const paginateData = this.pagination.paginateData<${module_name_cap}>(
      ${module_name}s,
      ${module_name}List.page,
      ${module_name}List.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(${module_name}Id: string): Promise<${module_name_cap} | null> {
    return await this.${module_name}Repository.find(${module_name}Id);
  }

  async update(
    ${module_name}Id: string,
    update${module_name_cap}Dto: Update${module_name_cap}Dto,
    manager?: EntityManager,
  ): Promise<${module_name_cap}> {
    const update${module_name_cap} = await this.${module_name}Repository.find(${module_name}Id);

    if (!update${module_name_cap}) {
      throw new UpdateException();
    }

    // Removi a verificação exist() pois não estava definida na interface
    // Se precisar, adicione o método exist() na interface do repository

    // atualiza o novo ${module_name}
    return this.${module_name}Repository.update(
      update${module_name_cap},
      update${module_name_cap}Dto,
      manager,
    );
  }

  async remove(${module_name}Id: string): Promise<${module_name_cap}> {
    const ${module_name} = await this.${module_name}Repository.find(${module_name}Id);

    if (!${module_name}) {
      throw new RemoveException();
    }

    return await this.${module_name}Repository.remove(${module_name});
  }

  async delete(${module_name}Id: string): Promise<boolean> {
    const ${module_name} = await this.${module_name}Repository.find(${module_name}Id);

    if (!${module_name}) {
      throw new RemoveException();
    }

    const deleted = await this.${module_name}Repository.delete(${module_name});

    return deleted ? true : false;
  }
}
EOF

# Cria create e update DTO
cat > "$module_path/dto/create-${module_name}.dto.ts" << EOF
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class Create${module_name_cap}Dto {
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
import { Create${module_name_cap}Dto } from './create-${module_name}.dto';
import { PartialType } from '@nestjs/swagger';

export class Update${module_name_cap}Dto extends PartialType(Create${module_name_cap}Dto) {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsNumber()
  value: number; // alterar nome
}
EOF

cat > "$module_path/dto/${module_name}-response.dto.ts" << EOF
import { Exclude, Expose } from 'class-transformer';

export class ${module_name_cap}ResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
EOF

cat > "$module_path/dto/${module_name}-list.dto.ts" << EOF
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ${module_name_cap}ListDto {
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